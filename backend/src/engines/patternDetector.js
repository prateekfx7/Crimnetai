import Entity from '../models/Entity.js';
import Relationship from '../models/Relationship.js';
import Pattern from '../models/Pattern.js';

/**
 * Run all pattern detection rules against a case's data
 */
export async function detectPatterns(caseId) {
  const patterns = [];

  patterns.push(...await detectCallFrequencySpikes(caseId));
  patterns.push(...await detectCircularTransactions(caseId));
  patterns.push(...await detectBurnerPhonePatterns(caseId));
  patterns.push(...await detectHighValueTransfers(caseId));
  patterns.push(...await detectRapidTransactions(caseId));

  // Save patterns to DB
  for (const pattern of patterns) {
    const existing = await Pattern.findOne({
      caseId,
      type: pattern.type,
      title: pattern.title,
    });

    if (!existing) {
      await Pattern.create({ caseId, ...pattern });
    }
  }

  // Update case pattern count
  const totalPatterns = await Pattern.countDocuments({ caseId });
  const Case = (await import('../models/Case.js')).default;
  await Case.findByIdAndUpdate(caseId, { patternCount: totalPatterns });

  return Pattern.find({ caseId }).populate('involvedEntities');
}

/**
 * Detect unusual call frequency spikes between phone numbers
 */
async function detectCallFrequencySpikes(caseId) {
  const patterns = [];
  const callRelationships = await Relationship.find({ caseId, type: 'CALL' });

  for (const rel of callRelationships) {
    const interactionCount = rel.interactions?.length || 0;

    // Flag if more than 8 calls between the same pair
    if (interactionCount >= 8) {
      // Check for temporal clustering
      const timestamps = (rel.interactions || [])
        .map(i => i.timestamp ? new Date(i.timestamp).getTime() : 0)
        .filter(t => t > 0)
        .sort();

      let hasSpike = false;
      let spikeDetail = '';

      if (timestamps.length >= 5) {
        // Check for 5+ calls within 2 hours
        for (let i = 0; i <= timestamps.length - 5; i++) {
          const windowMs = timestamps[i + 4] - timestamps[i];
          if (windowMs <= 2 * 60 * 60 * 1000) { // 2 hours
            hasSpike = true;
            spikeDetail = `${5} calls within ${Math.round(windowMs / 60000)} minutes`;
            break;
          }
        }
      }

      const severity = interactionCount >= 15 ? 'critical' : (interactionCount >= 10 ? 'high' : 'medium');
      const score = Math.min(100, interactionCount * 7);

      patterns.push({
        type: 'CALL_FREQUENCY_SPIKE',
        severity,
        score,
        title: `High call frequency: ${rel.sourceName} ↔ ${rel.targetName}`,
        description: `${interactionCount} calls detected between ${rel.sourceName} and ${rel.targetName}. ${hasSpike ? `Spike detected: ${spikeDetail}` : 'Sustained high volume communication pattern.'}`,
        involvedEntities: [rel.sourceEntityId, rel.targetEntityId],
        involvedEntityNames: [rel.sourceName, rel.targetName],
        evidence: {
          callCount: interactionCount,
          hasTemporalSpike: hasSpike,
          spikeDetail,
        },
      });
    }
  }

  return patterns;
}

/**
 * Detect circular/layered financial transactions (A→B→C→A)
 */
async function detectCircularTransactions(caseId) {
  const patterns = [];
  const financialRels = await Relationship.find({ caseId, type: 'FINANCIAL' });

  // Build adjacency map
  const adjMap = new Map();
  for (const rel of financialRels) {
    const sourceId = rel.sourceEntityId.toString();
    const targetId = rel.targetEntityId.toString();

    if (!adjMap.has(sourceId)) adjMap.set(sourceId, new Set());
    if (!adjMap.has(targetId)) adjMap.set(targetId, new Set());
    adjMap.get(sourceId).add(targetId);
    adjMap.get(targetId).add(sourceId);
  }

  // Find triangles (A-B-C-A) indicating circular money flow
  const visited = new Set();
  for (const [nodeA, neighborsA] of adjMap) {
    for (const nodeB of neighborsA) {
      if (nodeB <= nodeA) continue;
      const neighborsB = adjMap.get(nodeB) || new Set();
      for (const nodeC of neighborsB) {
        if (nodeC <= nodeB) continue;
        if (neighborsA.has(nodeC)) {
          const triangleKey = [nodeA, nodeB, nodeC].sort().join('-');
          if (!visited.has(triangleKey)) {
            visited.add(triangleKey);

            const entities = await Entity.find({ _id: { $in: [nodeA, nodeB, nodeC] } });
            const names = entities.map(e => e.name);

            patterns.push({
              type: 'CIRCULAR_TRANSACTION',
              severity: 'high',
              score: 85,
              title: `Circular transaction detected: ${names.join(' → ')}`,
              description: `A triangular financial relationship was detected among ${names.join(', ')}. This pattern may indicate money laundering through layered transactions.`,
              involvedEntities: entities.map(e => e._id),
              involvedEntityNames: names,
              evidence: {
                cycle: names,
                pattern: 'triangle',
              },
            });
          }
        }
      }
    }
  }

  return patterns;
}

/**
 * Detect burner phone patterns: high-frequency short-duration calls
 */
async function detectBurnerPhonePatterns(caseId) {
  const patterns = [];
  const phoneEntities = await Entity.find({ caseId, type: 'PHONE_NUMBER' });

  for (const phone of phoneEntities) {
    const relationships = await Relationship.find({
      caseId,
      type: 'CALL',
      $or: [
        { sourceEntityId: phone._id },
        { targetEntityId: phone._id },
      ],
    });

    // Count total interactions and unique contacts
    let totalCalls = 0;
    const uniqueContacts = new Set();

    for (const rel of relationships) {
      totalCalls += rel.interactions?.length || 0;
      const otherId = rel.sourceEntityId.toString() === phone._id.toString() 
        ? rel.targetEntityId.toString() 
        : rel.sourceEntityId.toString();
      uniqueContacts.add(otherId);
    }

    // Burner pattern: many calls to many different numbers
    if (totalCalls >= 10 && uniqueContacts.size >= 5) {
      const ratio = totalCalls / uniqueContacts.size;

      if (ratio >= 2) {
        patterns.push({
          type: 'BURNER_PHONE',
          severity: 'high',
          score: Math.min(95, 60 + uniqueContacts.size * 3),
          title: `Potential burner phone: ${phone.name}`,
          description: `Phone number ${phone.name} shows ${totalCalls} calls across ${uniqueContacts.size} unique contacts. High volume, distributed communication pattern typical of disposable phones.`,
          involvedEntities: [phone._id],
          involvedEntityNames: [phone.name],
          evidence: {
            totalCalls,
            uniqueContacts: uniqueContacts.size,
            callsPerContact: Math.round(ratio * 10) / 10,
          },
        });
      }
    }
  }

  return patterns;
}

/**
 * Detect high-value financial transfers
 */
async function detectHighValueTransfers(caseId) {
  const patterns = [];
  const financialRels = await Relationship.find({ caseId, type: 'FINANCIAL' });

  for (const rel of financialRels) {
    const totalAmount = rel.metadata?.totalAmount || 0;

    if (totalAmount >= 500000) { // ₹5 lakh+
      const severity = totalAmount >= 2500000 ? 'critical' : (totalAmount >= 1000000 ? 'high' : 'medium');
      const score = Math.min(100, Math.round(totalAmount / 50000));

      patterns.push({
        type: 'HIGH_VALUE_TRANSFER',
        severity,
        score,
        title: `High-value transfer: ${rel.sourceName} → ${rel.targetName}`,
        description: `Total ₹${totalAmount.toLocaleString('en-IN')} transferred between ${rel.sourceName} and ${rel.targetName} across ${rel.interactions?.length || 1} transactions.`,
        involvedEntities: [rel.sourceEntityId, rel.targetEntityId],
        involvedEntityNames: [rel.sourceName, rel.targetName],
        evidence: {
          totalAmount,
          transactionCount: rel.interactions?.length || 1,
          avgAmount: Math.round(totalAmount / (rel.interactions?.length || 1)),
        },
      });
    }
  }

  return patterns;
}

/**
 * Detect rapid successive transactions (possible structuring)
 */
async function detectRapidTransactions(caseId) {
  const patterns = [];
  const financialRels = await Relationship.find({ caseId, type: 'FINANCIAL' });

  for (const rel of financialRels) {
    const timestamps = (rel.interactions || [])
      .map(i => i.timestamp ? new Date(i.timestamp).getTime() : 0)
      .filter(t => t > 0)
      .sort();

    if (timestamps.length >= 3) {
      // Check for 3+ transactions within 1 hour
      for (let i = 0; i <= timestamps.length - 3; i++) {
        const windowMs = timestamps[i + 2] - timestamps[i];
        if (windowMs <= 60 * 60 * 1000) { // 1 hour
          patterns.push({
            type: 'RAPID_TRANSACTIONS',
            severity: 'medium',
            score: 70,
            title: `Rapid transactions: ${rel.sourceName} ↔ ${rel.targetName}`,
            description: `${3}+ financial transactions within 1 hour between ${rel.sourceName} and ${rel.targetName}. May indicate structuring to avoid reporting thresholds.`,
            involvedEntities: [rel.sourceEntityId, rel.targetEntityId],
            involvedEntityNames: [rel.sourceName, rel.targetName],
            evidence: {
              transactionsInWindow: 3,
              windowMinutes: Math.round(windowMs / 60000),
            },
          });
          break;
        }
      }
    }
  }

  return patterns;
}
