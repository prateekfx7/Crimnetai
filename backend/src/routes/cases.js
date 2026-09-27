import { Router } from 'express';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import Case from '../models/Case.js';
import Entity from '../models/Entity.js';
import DataSource from '../models/DataSource.js';
import Relationship from '../models/Relationship.js';
import Pattern from '../models/Pattern.js';
import { authenticate } from '../middleware/auth.js';
import { extractEntities, extractCDREntities, extractFinancialEntities } from '../engines/entityExtractor.js';
import { 
  buildCDRRelationships, 
  buildFinancialRelationships, 
  buildCoOccurrenceRelationships,
  computeCentralityMetrics,
  getNetworkData 
} from '../engines/graphBuilder.js';
import { detectPatterns } from '../engines/patternDetector.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/cases - Create a new case
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const caseDoc = await Case.create({
      title,
      description,
      tags: tags || [],
      createdBy: req.user._id,
      assignedTo: req.user._id,
    });
    res.status(201).json(caseDoc);
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ error: 'Failed to create case.' });
  }
});

// GET /api/cases - List all cases
router.get('/', authenticate, async (req, res) => {
  try {
    const cases = await Case.find()
      .populate('createdBy', 'fullName username')
      .populate('assignedTo', 'fullName username')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    console.error('List cases error:', error);
    res.status(500).json({ error: 'Failed to list cases.' });
  }
});

// GET /api/cases/:id - Get a specific case
router.get('/:id', authenticate, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id)
      .populate('createdBy', 'fullName username')
      .populate('assignedTo', 'fullName username');
    if (!caseDoc) return res.status(404).json({ error: 'Case not found.' });
    res.json(caseDoc);
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ error: 'Failed to get case.' });
  }
});

// POST /api/cases/:id/upload - Upload FIR/CDR/financial data
router.post('/:id/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    const caseId = req.params.id;
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ error: 'Case not found.' });

    const sourceType = req.body.sourceType || 'FIR';
    let result = { entities: [], relationships: [] };

    if (req.file) {
      const content = req.file.buffer.toString('utf-8');
      const filename = req.file.originalname;

      if (sourceType === 'CDR' || filename.endsWith('.csv') && sourceType !== 'FINANCIAL') {
        // Parse CSV for CDR data
        if (sourceType === 'CDR') {
          const records = await parseCSV(content);
          const ds = await DataSource.create({
            caseId, type: 'CDR', filename, rawContent: content,
            parsedData: records, recordCount: records.length,
            processed: true, uploadedBy: req.user._id,
          });
          
          const entities = extractCDREntities(records);
          const savedEntities = await saveEntities(caseId, entities);
          const relationships = await buildCDRRelationships(caseId, records);

          result = { entities: savedEntities, relationships, dataSource: ds };
        }
      }
      
      if (sourceType === 'FINANCIAL') {
        const records = await parseCSV(content);
        const ds = await DataSource.create({
          caseId, type: 'FINANCIAL', filename, rawContent: content,
          parsedData: records, recordCount: records.length,
          processed: true, uploadedBy: req.user._id,
        });

        const entities = extractFinancialEntities(records);
        const savedEntities = await saveEntities(caseId, entities);
        const relationships = await buildFinancialRelationships(caseId, records);

        result = { entities: savedEntities, relationships, dataSource: ds };
      }

      if (sourceType === 'FIR' || sourceType === 'SURVEILLANCE') {
        const ds = await DataSource.create({
          caseId, type: sourceType, filename, rawContent: content,
          processed: true, uploadedBy: req.user._id,
        });

        const entities = extractEntities(content, sourceType, ds._id.toString());
        const savedEntities = await saveEntities(caseId, entities);
        const entityNames = savedEntities.map(e => e.name);
        const relationships = await buildCoOccurrenceRelationships(caseId, entityNames, sourceType);

        result = { entities: savedEntities, relationships, dataSource: ds };
      }
    } else if (req.body.text) {
      // Direct text input (for FIR narratives)
      const ds = await DataSource.create({
        caseId, type: sourceType, rawContent: req.body.text,
        processed: true, uploadedBy: req.user._id,
      });

      const entities = extractEntities(req.body.text, sourceType, ds._id.toString());
      const savedEntities = await saveEntities(caseId, entities);
      const entityNames = savedEntities.map(e => e.name);
      const relationships = await buildCoOccurrenceRelationships(caseId, entityNames, sourceType);

      result = { entities: savedEntities, relationships, dataSource: ds };
    }

    // Update entity count
    const entityCount = await Entity.countDocuments({ caseId });
    await Case.findByIdAndUpdate(caseId, { entityCount });

    // Run analytics after upload
    await computeCentralityMetrics(caseId);
    await detectPatterns(caseId);

    res.json({
      message: 'Data uploaded and processed successfully.',
      entitiesFound: result.entities.length,
      relationshipsCreated: result.relationships.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process upload.', details: error.message });
  }
});

// GET /api/cases/:id/entities - List extracted entities
router.get('/:id/entities', authenticate, async (req, res) => {
  try {
    const { type, search } = req.query;
    const filter = { caseId: req.params.id };
    if (type) filter.type = type;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const entities = await Entity.find(filter).sort({ influenceScore: -1 });
    res.json(entities);
  } catch (error) {
    console.error('List entities error:', error);
    res.status(500).json({ error: 'Failed to list entities.' });
  }
});

// GET /api/cases/:id/network - Get graph data for visualization
router.get('/:id/network', authenticate, async (req, res) => {
  try {
    const network = await getNetworkData(req.params.id);
    res.json(network);
  } catch (error) {
    console.error('Get network error:', error);
    res.status(500).json({ error: 'Failed to get network data.' });
  }
});

// GET /api/cases/:id/influencers - Ranked key individuals
router.get('/:id/influencers', authenticate, async (req, res) => {
  try {
    const entities = await Entity.find({ caseId: req.params.id })
      .sort({ influenceScore: -1 })
      .limit(20);
    res.json(entities);
  } catch (error) {
    console.error('Get influencers error:', error);
    res.status(500).json({ error: 'Failed to get influencers.' });
  }
});

// GET /api/cases/:id/patterns - Suspicious pattern alerts
router.get('/:id/patterns', authenticate, async (req, res) => {
  try {
    const patterns = await Pattern.find({ caseId: req.params.id })
      .populate('involvedEntities', 'name type')
      .sort({ score: -1 });
    res.json(patterns);
  } catch (error) {
    console.error('Get patterns error:', error);
    res.status(500).json({ error: 'Failed to get patterns.' });
  }
});

// POST /api/cases/:id/analyze - Re-run analysis
router.post('/:id/analyze', authenticate, async (req, res) => {
  try {
    const caseId = req.params.id;
    const { metrics } = await computeCentralityMetrics(caseId);
    const patterns = await detectPatterns(caseId);
    res.json({
      message: 'Analysis complete.',
      metricsComputed: Object.keys(metrics).length,
      patternsDetected: patterns.length,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to run analysis.' });
  }
});

// GET /api/cases/:id/stats - Dashboard stats
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const caseId = req.params.id;
    const [entityCount, relationshipCount, patternCount, dataSources] = await Promise.all([
      Entity.countDocuments({ caseId }),
      Relationship.countDocuments({ caseId }),
      Pattern.countDocuments({ caseId }),
      DataSource.countDocuments({ caseId }),
    ]);

    const mongoose = (await import('mongoose')).default;
    const isObjectId = mongoose.Types.ObjectId.isValid(caseId);
    const caseMatch = isObjectId
      ? { $or: [{ caseId: mongoose.Types.ObjectId.createFromHexString(caseId) }, { caseId }] }
      : { caseId };

    const entityTypes = await Entity.aggregate([
      { $match: caseMatch },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const patternTypes = await Pattern.aggregate([
      { $match: caseMatch },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    const topInfluencer = await Entity.findOne({ caseId }).sort({ influenceScore: -1 });

    res.json({
      entityCount,
      relationshipCount,
      patternCount,
      dataSourceCount: dataSources,
      entityTypes: Object.fromEntries(entityTypes.map(e => [e._id, e.count])),
      patternSeverities: Object.fromEntries(patternTypes.map(p => [p._id, p.count])),
      topInfluencer: topInfluencer ? { name: topInfluencer.name, score: topInfluencer.influenceScore, type: topInfluencer.type } : null,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats.' });
  }
});

// Helper: parse CSV from string
function parseCSV(content) {
  return new Promise((resolve, reject) => {
    const records = [];
    const stream = Readable.from([content]);
    stream
      .pipe(csvParser())
      .on('data', (row) => records.push(row))
      .on('end', () => resolve(records))
      .on('error', reject);
  });
}

// Helper: save entities to DB with deduplication
async function saveEntities(caseId, entities) {
  const saved = [];
  for (const entity of entities) {
    try {
      const existing = await Entity.findOne({ caseId, name: entity.name, type: entity.type });
      if (existing) {
        // Merge aliases and update confidence
        const newAliases = [...new Set([...(existing.aliases || []), ...(entity.aliases || [])])];
        existing.aliases = newAliases;
        existing.confidence = Math.max(existing.confidence, entity.confidence);
        if (entity.source) {
          existing.sources = existing.sources || [];
          existing.sources.push(entity.source);
        }
        await existing.save();
        saved.push(existing);
      } else {
        const newEntity = await Entity.create({
          caseId,
          name: entity.name,
          type: entity.type,
          aliases: entity.aliases || [],
          confidence: entity.confidence,
          sources: entity.source ? [entity.source] : [],
        });
        saved.push(newEntity);
      }
    } catch (error) {
      // Ignore duplicate key errors
      if (error.code !== 11000) {
        console.error('Save entity error:', error.message);
      }
    }
  }
  return saved;
}

export default router;
