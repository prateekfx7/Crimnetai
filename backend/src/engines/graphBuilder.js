import Graph from 'graphology';
import { degreeCentrality } from 'graphology-metrics/centrality/degree.js';
import betweennessCentrality from 'graphology-metrics/centrality/betweenness.js';
import pagerank from 'graphology-metrics/centrality/pagerank.js';
import Entity from '../models/Entity.js';
import Relationship from '../models/Relationship.js';

/**
 * Build an in-memory graphology graph from MongoDB entities and relationships for a given case
 */
export async function buildGraph(caseId) {
  const graph = new Graph({ type: 'undirected', multi: false, allowSelfLoops: false });

  const entities = await Entity.find({ caseId });
  const relationships = await Relationship.find({ caseId });

  // Add nodes
  for (const entity of entities) {
    const nodeId = entity._id.toString();
    if (!graph.hasNode(nodeId)) {
      graph.addNode(nodeId, {
        label: entity.name,
        type: entity.type,
        confidence: entity.confidence,
        aliases: entity.aliases,
        mongoId: entity._id.toString(),
      });
    }
  }

  // Add edges
  for (const rel of relationships) {
    const sourceId = rel.sourceEntityId.toString();
    const targetId = rel.targetEntityId.toString();

    if (graph.hasNode(sourceId) && graph.hasNode(targetId) && sourceId !== targetId) {
      const edgeKey = `${sourceId}-${targetId}-${rel.type}`;
      if (!graph.hasEdge(edgeKey)) {
        try {
          graph.addEdgeWithKey(edgeKey, sourceId, targetId, {
            type: rel.type,
            weight: rel.weight,
            interactionCount: rel.interactions?.length || 0,
            mongoId: rel._id.toString(),
          });
        } catch (e) {
          // Edge might already exist in undirected graph
        }
      }
    }
  }

  return graph;
}

/**
 * Compute centrality metrics and update entity records
 */
export async function computeCentralityMetrics(caseId) {
  const graph = await buildGraph(caseId);

  if (graph.order < 2) {
    console.log('Graph has fewer than 2 nodes, skipping centrality computation');
    return { graph, metrics: {} };
  }

  // Compute metrics
  const degree = degreeCentrality(graph);
  const betweenness = betweennessCentrality(graph);
  const pr = pagerank(graph);

  const metrics = {};

  // Update each entity with computed metrics
  for (const nodeId of graph.nodes()) {
    const attrs = graph.getNodeAttributes(nodeId);
    const degreeScore = degree[nodeId] || 0;
    const betweennessScore = betweenness[nodeId] || 0;
    const pageRankScore = pr[nodeId] || 0;

    // Composite influence score (weighted combination)
    const influenceScore = (degreeScore * 0.3 + betweennessScore * 0.4 + pageRankScore * 0.3);

    metrics[nodeId] = {
      label: attrs.label,
      type: attrs.type,
      degreeCentrality: degreeScore,
      betweennessCentrality: betweennessScore,
      pageRank: pageRankScore,
      influenceScore,
    };

    // Update MongoDB entity
    await Entity.findByIdAndUpdate(nodeId, {
      degreeCentrality: degreeScore,
      betweennessCentrality: betweennessScore,
      pageRank: pageRankScore,
      influenceScore,
    });
  }

  return { graph, metrics };
}

/**
 * Build edges from CDR data between phone number entities
 */
export async function buildCDRRelationships(caseId, records) {
  const relationships = [];
  const entities = await Entity.find({ caseId });
  const entityMap = new Map();

  for (const entity of entities) {
    entityMap.set(entity.name, entity);
    for (const alias of (entity.aliases || [])) {
      entityMap.set(alias, entity);
    }
  }

  // Group calls between same pairs
  const pairCounts = new Map();

  for (const record of records) {
    const caller = record.caller || record.calling_number || record.from;
    const callee = record.callee || record.called_number || record.to;
    const pairKey = [caller, callee].sort().join('|');

    if (!pairCounts.has(pairKey)) {
      pairCounts.set(pairKey, {
        caller,
        callee,
        interactions: [],
      });
    }

    pairCounts.get(pairKey).interactions.push({
      timestamp: record.timestamp ? new Date(record.timestamp) : new Date(),
      detail: `Call duration: ${record.duration || 'unknown'}s, Tower: ${record.tower_id || 'N/A'}`,
      sourceType: 'CDR',
    });
  }

  for (const [pairKey, data] of pairCounts) {
    const sourceEntity = entityMap.get(data.caller);
    const targetEntity = entityMap.get(data.callee);

    if (sourceEntity && targetEntity && sourceEntity._id.toString() !== targetEntity._id.toString()) {
      const existing = await Relationship.findOne({
        caseId,
        sourceEntityId: sourceEntity._id,
        targetEntityId: targetEntity._id,
        type: 'CALL',
      });

      if (existing) {
        existing.interactions.push(...data.interactions);
        existing.weight = existing.interactions.length;
        await existing.save();
        relationships.push(existing);
      } else {
        const rel = await Relationship.create({
          caseId,
          sourceEntityId: sourceEntity._id,
          targetEntityId: targetEntity._id,
          sourceName: sourceEntity.name,
          targetName: targetEntity.name,
          type: 'CALL',
          weight: data.interactions.length,
          interactions: data.interactions,
        });
        relationships.push(rel);
      }
    }
  }

  return relationships;
}

/**
 * Build edges from financial transaction data between account/person entities
 */
export async function buildFinancialRelationships(caseId, records) {
  const relationships = [];
  const entities = await Entity.find({ caseId });
  const entityMap = new Map();

  for (const entity of entities) {
    entityMap.set(entity.name, entity);
    for (const alias of (entity.aliases || [])) {
      entityMap.set(alias, entity);
    }
  }

  const pairCounts = new Map();

  for (const record of records) {
    const sender = record.sender_account || record.from_account || record.sender_name || record.from_name;
    const receiver = record.receiver_account || record.to_account || record.receiver_name || record.to_name;
    const pairKey = [sender, receiver].sort().join('|');

    if (!pairCounts.has(pairKey)) {
      pairCounts.set(pairKey, {
        sender,
        receiver,
        interactions: [],
        totalAmount: 0,
      });
    }

    const amount = parseFloat(record.amount) || 0;
    pairCounts.get(pairKey).totalAmount += amount;
    pairCounts.get(pairKey).interactions.push({
      timestamp: record.timestamp ? new Date(record.timestamp) : new Date(),
      detail: `Amount: ₹${amount}, Method: ${record.method || 'Transfer'}`,
      sourceType: 'FINANCIAL',
    });
  }

  for (const [pairKey, data] of pairCounts) {
    const sourceEntity = entityMap.get(data.sender);
    const targetEntity = entityMap.get(data.receiver);

    if (sourceEntity && targetEntity && sourceEntity._id.toString() !== targetEntity._id.toString()) {
      const existing = await Relationship.findOne({
        caseId,
        sourceEntityId: sourceEntity._id,
        targetEntityId: targetEntity._id,
        type: 'FINANCIAL',
      });

      if (existing) {
        existing.interactions.push(...data.interactions);
        existing.weight = existing.interactions.length;
        existing.metadata = { ...existing.metadata, totalAmount: (existing.metadata?.totalAmount || 0) + data.totalAmount };
        await existing.save();
        relationships.push(existing);
      } else {
        const rel = await Relationship.create({
          caseId,
          sourceEntityId: sourceEntity._id,
          targetEntityId: targetEntity._id,
          sourceName: sourceEntity.name,
          targetName: targetEntity.name,
          type: 'FINANCIAL',
          weight: data.interactions.length,
          interactions: data.interactions,
          metadata: { totalAmount: data.totalAmount },
        });
        relationships.push(rel);
      }
    }
  }

  return relationships;
}

/**
 * Build co-occurrence edges from FIR/text entities
 */
export async function buildCoOccurrenceRelationships(caseId, entityNames, sourceType = 'FIR') {
  const relationships = [];
  const entities = await Entity.find({ caseId, name: { $in: entityNames } });

  // Build edges between all entities that co-occur in the same document
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const source = entities[i];
      const target = entities[j];

      if (source._id.toString() === target._id.toString()) continue;
      // Only create co-occurrence for persons, organizations, phones
      if (!['PERSON', 'ORGANIZATION', 'PHONE_NUMBER'].includes(source.type) ||
          !['PERSON', 'ORGANIZATION', 'PHONE_NUMBER'].includes(target.type)) continue;

      const existing = await Relationship.findOne({
        caseId,
        $or: [
          { sourceEntityId: source._id, targetEntityId: target._id },
          { sourceEntityId: target._id, targetEntityId: source._id },
        ],
        type: 'CO_OCCURRENCE',
      });

      if (existing) {
        existing.weight += 1;
        existing.interactions.push({
          timestamp: new Date(),
          detail: `Co-occurrence in ${sourceType} document`,
          sourceType,
        });
        await existing.save();
        relationships.push(existing);
      } else {
        const rel = await Relationship.create({
          caseId,
          sourceEntityId: source._id,
          targetEntityId: target._id,
          sourceName: source.name,
          targetName: target.name,
          type: 'CO_OCCURRENCE',
          weight: 1,
          interactions: [{
            timestamp: new Date(),
            detail: `Co-occurrence in ${sourceType} document`,
            sourceType,
          }],
        });
        relationships.push(rel);
      }
    }
  }

  return relationships;
}

/**
 * Get the network graph data formatted for frontend visualization
 */
export async function getNetworkData(caseId) {
  const entities = await Entity.find({ caseId });
  const relationships = await Relationship.find({ caseId });

  const nodes = entities.map(e => ({
    id: e._id.toString(),
    label: e.name,
    type: e.type,
    confidence: e.confidence,
    aliases: e.aliases,
    influenceScore: e.influenceScore,
    degreeCentrality: e.degreeCentrality,
    betweennessCentrality: e.betweennessCentrality,
    pageRank: e.pageRank,
    flagged: e.flagged,
    flagReason: e.flagReason,
  }));

  const edges = relationships.map(r => ({
    id: r._id.toString(),
    source: r.sourceEntityId.toString(),
    target: r.targetEntityId.toString(),
    sourceName: r.sourceName,
    targetName: r.targetName,
    type: r.type,
    weight: r.weight,
    interactionCount: r.interactions?.length || 0,
  }));

  return { nodes, edges };
}
