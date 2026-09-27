import nlp from 'compromise';
import stringSimilarity from 'string-similarity';

// Regex patterns for structured entity extraction
const PHONE_REGEX = /(?:\+91[\s-]?)?(?:\d{10}|\d{5}[\s-]\d{5}|\d{4}[\s-]\d{3}[\s-]\d{3})/g;
const VEHICLE_REGEX = /[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{4}/g;
const ACCOUNT_REGEX = /(?:A\/C|Account|Acc)[\s:#]*(\d{8,18})/gi;
const AADHAAR_REGEX = /\d{4}[\s-]?\d{4}[\s-]?\d{4}/g;

// Indian location gazetteer (common cities/areas mentioned in FIRs)
const KNOWN_LOCATIONS = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Jaipur', 'Lucknow', 'Bhopal', 'Patna', 'Indore', 'Nagpur', 'Surat', 'Varanasi',
  'Andheri', 'Bandra', 'Juhu', 'Malad', 'Borivali', 'Thane', 'Kurla', 'Dadar',
  'Connaught Place', 'Karol Bagh', 'Chandni Chowk', 'Sarojini Nagar', 'Lajpat Nagar',
  'MG Road', 'Brigade Road', 'Koramangala', 'Whitefield', 'Electronic City',
  'Dharavi', 'Vikhroli', 'Powai', 'Goregaon', 'Versova', 'Jogeshwari',
  'Sector 18', 'Sector 62', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad',
];

// Common Indian criminal organization keywords
const ORG_KEYWORDS = ['gang', 'syndicate', 'cartel', 'network', 'group', 'organization', 'ring', 'mafia', 'racket'];

/**
 * Extract entities from unstructured text using compromise.js NLP + regex patterns
 */
export function extractEntities(text, sourceType = 'FIR', sourceId = '') {
  const entities = [];

  // 1. Extract PERSON names using compromise.js
  const doc = nlp(text);
  const people = doc.people().out('array');
  for (const person of people) {
    const cleaned = person.trim();
    if (cleaned.length > 2 && cleaned.length < 60) {
      entities.push({
        name: cleaned,
        type: 'PERSON',
        confidence: 0.85,
        source: { sourceType, sourceId, extractedFrom: text.substring(0, 200) },
      });
    }
  }

  // 2. Extract PHONE_NUMBER via regex
  const phones = text.match(PHONE_REGEX) || [];
  for (const phone of phones) {
    const cleaned = phone.replace(/[\s-]/g, '');
    entities.push({
      name: cleaned,
      type: 'PHONE_NUMBER',
      confidence: 0.95,
      source: { sourceType, sourceId, extractedFrom: text.substring(0, 200) },
    });
  }

  // 3. Extract VEHICLE_NO via regex
  const vehicles = text.match(VEHICLE_REGEX) || [];
  for (const v of vehicles) {
    entities.push({
      name: v.replace(/\s/g, ''),
      type: 'VEHICLE_NO',
      confidence: 0.92,
      source: { sourceType, sourceId, extractedFrom: text.substring(0, 200) },
    });
  }

  // 4. Extract ACCOUNT numbers via regex
  let match;
  const accountRegex = new RegExp(ACCOUNT_REGEX.source, 'gi');
  while ((match = accountRegex.exec(text)) !== null) {
    entities.push({
      name: match[1],
      type: 'ACCOUNT',
      confidence: 0.9,
      source: { sourceType, sourceId, extractedFrom: text.substring(0, 200) },
    });
  }

  // 5. Extract LOCATION using compromise + gazetteer
  const places = doc.places().out('array');
  for (const place of places) {
    const cleaned = place.trim();
    if (cleaned.length > 2) {
      entities.push({
        name: cleaned,
        type: 'LOCATION',
        confidence: 0.8,
        source: { sourceType, sourceId, extractedFrom: text.substring(0, 200) },
      });
    }
  }

  // Also check against gazetteer for Indian locations
  for (const loc of KNOWN_LOCATIONS) {
    if (text.toLowerCase().includes(loc.toLowerCase())) {
      const alreadyFound = entities.find(e => e.type === 'LOCATION' && 
        e.name.toLowerCase() === loc.toLowerCase());
      if (!alreadyFound) {
        entities.push({
          name: loc,
          type: 'LOCATION',
          confidence: 0.88,
          source: { sourceType, sourceId, extractedFrom: text.substring(0, 200) },
        });
      }
    }
  }

  // 6. Extract ORGANIZATION using compromise + keyword matching
  const orgs = doc.organizations().out('array');
  for (const org of orgs) {
    const cleaned = org.trim();
    if (cleaned.length > 2) {
      entities.push({
        name: cleaned,
        type: 'ORGANIZATION',
        confidence: 0.75,
        source: { sourceType, sourceId, extractedFrom: text.substring(0, 200) },
      });
    }
  }

  // Keyword-based org extraction
  const sentences = text.split(/[.!?\n]/);
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    for (const keyword of ORG_KEYWORDS) {
      if (lower.includes(keyword)) {
        // Try to extract the org name: look for capitalized words before keyword
        const pattern = new RegExp(`([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+)*)\\s+${keyword}`, 'g');
        let orgMatch;
        while ((orgMatch = pattern.exec(sentence)) !== null) {
          entities.push({
            name: `${orgMatch[1]} ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`,
            type: 'ORGANIZATION',
            confidence: 0.7,
            source: { sourceType, sourceId, extractedFrom: sentence.trim() },
          });
        }
      }
    }
  }

  return deduplicateEntities(entities);
}

/**
 * Deduplicate entities using fuzzy string matching
 */
function deduplicateEntities(entities) {
  const deduplicated = [];
  const SIMILARITY_THRESHOLD = 0.75;

  for (const entity of entities) {
    let foundMatch = false;

    for (const existing of deduplicated) {
      if (existing.type !== entity.type) continue;

      const similarity = stringSimilarity.compareTwoStrings(
        existing.name.toLowerCase(),
        entity.name.toLowerCase()
      );

      if (similarity >= SIMILARITY_THRESHOLD) {
        // Keep the longer name as the canonical form, add shorter as alias
        if (entity.name.length > existing.name.length) {
          existing.aliases = existing.aliases || [];
          existing.aliases.push(existing.name);
          existing.name = entity.name;
        } else {
          existing.aliases = existing.aliases || [];
          if (!existing.aliases.includes(entity.name) && existing.name !== entity.name) {
            existing.aliases.push(entity.name);
          }
        }
        // Boost confidence when multiple sources agree
        existing.confidence = Math.min(1.0, existing.confidence + 0.05);
        foundMatch = true;
        break;
      }
    }

    if (!foundMatch) {
      deduplicated.push({ ...entity, aliases: entity.aliases || [] });
    }
  }

  return deduplicated;
}

/**
 * Extract entities from CDR (call detail record) CSV data
 */
export function extractCDREntities(records) {
  const entities = [];
  const phoneSet = new Set();

  for (const record of records) {
    const caller = record.caller || record.calling_number || record.from;
    const callee = record.callee || record.called_number || record.to;

    if (caller && !phoneSet.has(caller)) {
      phoneSet.add(caller);
      entities.push({
        name: caller,
        type: 'PHONE_NUMBER',
        confidence: 0.98,
        source: { sourceType: 'CDR', sourceId: 'cdr_upload', extractedFrom: 'CDR record' },
        aliases: [],
      });
    }

    if (callee && !phoneSet.has(callee)) {
      phoneSet.add(callee);
      entities.push({
        name: callee,
        type: 'PHONE_NUMBER',
        confidence: 0.98,
        source: { sourceType: 'CDR', sourceId: 'cdr_upload', extractedFrom: 'CDR record' },
        aliases: [],
      });
    }
  }

  return entities;
}

/**
 * Extract entities from financial transaction CSV data
 */
export function extractFinancialEntities(records) {
  const entities = [];
  const accountSet = new Set();
  const nameSet = new Set();

  for (const record of records) {
    const senderAccount = record.sender_account || record.from_account;
    const receiverAccount = record.receiver_account || record.to_account;
    const senderName = record.sender_name || record.from_name;
    const receiverName = record.receiver_name || record.to_name;

    if (senderAccount && !accountSet.has(senderAccount)) {
      accountSet.add(senderAccount);
      entities.push({
        name: senderAccount,
        type: 'ACCOUNT',
        confidence: 0.98,
        source: { sourceType: 'FINANCIAL', sourceId: 'financial_upload', extractedFrom: 'Financial record' },
        aliases: [],
      });
    }

    if (receiverAccount && !accountSet.has(receiverAccount)) {
      accountSet.add(receiverAccount);
      entities.push({
        name: receiverAccount,
        type: 'ACCOUNT',
        confidence: 0.98,
        source: { sourceType: 'FINANCIAL', sourceId: 'financial_upload', extractedFrom: 'Financial record' },
        aliases: [],
      });
    }

    if (senderName && !nameSet.has(senderName)) {
      nameSet.add(senderName);
      entities.push({
        name: senderName,
        type: 'PERSON',
        confidence: 0.9,
        source: { sourceType: 'FINANCIAL', sourceId: 'financial_upload', extractedFrom: 'Financial record' },
        aliases: [],
      });
    }

    if (receiverName && !nameSet.has(receiverName)) {
      nameSet.add(receiverName);
      entities.push({
        name: receiverName,
        type: 'PERSON',
        confidence: 0.9,
        source: { sourceType: 'FINANCIAL', sourceId: 'financial_upload', extractedFrom: 'Financial record' },
        aliases: [],
      });
    }
  }

  return entities;
}
