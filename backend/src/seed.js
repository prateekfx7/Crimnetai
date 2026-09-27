import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Case from './models/Case.js';
import Entity from './models/Entity.js';
import Relationship from './models/Relationship.js';
import Pattern from './models/Pattern.js';
import DataSource from './models/DataSource.js';
import { extractEntities } from './engines/entityExtractor.js';
import { 
  buildCoOccurrenceRelationships, 
  buildCDRRelationships, 
  buildFinancialRelationships,
  computeCentralityMetrics 
} from './engines/graphBuilder.js';
import { detectPatterns } from './engines/patternDetector.js';

dotenv.config();

// ============================================================
// SAMPLE DATA
// ============================================================

const FIR_NARRATIVES = [
  {
    title: 'FIR #2024/MUM/4521 - Drug Trafficking Network',
    text: `On 15th March 2024, acting on a tip-off received from an informant, officers of the Mumbai Crime Branch raided a warehouse in Andheri East. During the raid, approximately 50 kg of methamphetamine valued at Rs. 15 crore was seized. 

The accused Rajesh Kumar (age 35, resident of Bandra West, phone: 9876543210) was apprehended at the scene. During interrogation, Kumar revealed that the consignment was meant for delivery to Vikram Singh (phone: 9871234567), a known associate operating from a rented flat in Juhu.

Further investigation revealed that the shipment was arranged by a person known as "Boss" Deepak Malhotra, who operates the Malhotra Syndicate from Pune. Kumar stated he received instructions via phone calls from Malhotra and another associate named Sunil Yadav (phone: 9865432178), who manages logistics.

Vehicle MH02AB1234, a white Innova registered in the name of a shell company "Greenfield Enterprises", was used for transportation. Tower location records indicate frequent stops in Powai and Vikhroli areas.

Financial records suggest payments were routed through Priya Sharma (phone: 9854321098), who acts as the financial handler for the network. She operates accounts in multiple banks under different identities. Bank account A/C 10234567890 in Bank of India received Rs. 25 lakhs on 10th March.`
  },
  {
    title: 'FIR #2024/MUM/4589 - Connected Extortion Ring',
    text: `On 22nd March 2024, complainant Anil Mehta (businessman, Goregaon) reported that he received threatening calls from Sunil Yadav (phone: 9865432178) demanding Rs. 50 lakhs as "protection money". The calls were traced to tower locations near Malad.

Investigation revealed that Yadav operates under the directions of Deepak Malhotra and is connected to at least 5 other extortion cases in Mumbai and Thane. 

Another associate, Firoz Khan (phone: 9845671234), was identified as the person who physically visited Mehta's factory in Goregaon to deliver threats. Khan was earlier arrested in a similar case in Delhi in 2019 under the name "Farhan Khan".

The gang also includes Ravi Patil (phone: 9834567890), who serves as the lookout and intelligence gatherer. Patil was spotted near the complainant's residence in vehicle MH04CD5678 (black Scorpio).

Surveillance confirms that Malhotra, Yadav, Khan, and Patil met at Hotel Grand in Andheri on 18th March, three days before the threats began. Phone records show intensive communication between all four individuals during this period, with Rajesh Kumar also making calls to Malhotra from an unknown location.`
  },
  {
    title: 'FIR #2024/MUM/4612 - Money Laundering Operation',
    text: `Based on intelligence gathered from FIR #4521 and #4589, the Economic Offenses Wing initiated investigation into financial transactions linked to the Malhotra Syndicate.

Priya Sharma was found to be managing a complex web of hawala transactions through multiple shell companies. Investigation revealed the following entities: Greenfield Enterprises (Pune), BlueStar Trading Co. (Mumbai), and Omega Logistics (Thane).

Sharma has been making structured deposits of Rs. 49,000 each (just below reporting threshold) into accounts held by Neha Gupta (phone: 9823456789), who acts as a mule. Gupta then transfers funds to accounts controlled by Deepak Malhotra.

Additional surveillance of Sharma revealed meetings with an unidentified male at MG Road, Pune, suspected to be the international handler for the network. Phone number 9812345678 was used briefly and then discarded — classic burner phone behavior.

Total financial trail mapped so far: Rs. 3.5 crore across 45 transactions over 6 months. Accounts traced include A/C 20345678901 (HDFC), A/C 30456789012 (ICICI), A/C 40567890123 (SBI).

Vehicle MH12EF9012 (silver Honda City) registered to BlueStar Trading Co. was used by Sharma for courier runs between Mumbai and Pune.`
  },
  {
    title: 'FIR #2024/MUM/4650 - Arms Supply Network',
    text: `On 5th April 2024, acting on information from arrested accused Firoz Khan, police recovered 3 illegal firearms and ammunition from a farmhouse in Thane district owned by Ajay Deshmukh (phone: 9867891234).

Deshmukh is identified as the arms supplier for the Malhotra Syndicate. He procures weapons from contacts in Indore and stores them at various locations in Thane and Navi Mumbai.

Call records indicate that Deshmukh regularly communicates with Vikram Singh and Deepak Malhotra. He also has connections with Ravi Patil who provides logistics support.

A new associate named Karan Mehra (phone: 9856789123) was identified as Deshmukh's courier. Mehra uses vehicle MH46GH3456 (red Maruti Swift) for transportation of weapons.

Financial investigation reveals that Deshmukh received payments through cryptocurrency and also via Sunil Yadav's hawala network, with amounts totaling Rs. 80 lakhs over the past year. The money was received in A/C 50678901234 at Punjab National Bank.`
  }
];

const CDR_DATA = [
  { caller: '9876543210', callee: '9871234567', timestamp: '2024-03-10T08:15:00', duration: '120', tower_id: 'MUM-ANH-001' },
  { caller: '9876543210', callee: '9865432178', timestamp: '2024-03-10T09:30:00', duration: '45', tower_id: 'MUM-ANH-001' },
  { caller: '9865432178', callee: '9876543210', timestamp: '2024-03-10T11:00:00', duration: '90', tower_id: 'MUM-MLD-003' },
  { caller: '9871234567', callee: '9854321098', timestamp: '2024-03-11T14:20:00', duration: '200', tower_id: 'MUM-JUH-002' },
  { caller: '9876543210', callee: '9871234567', timestamp: '2024-03-12T07:45:00', duration: '60', tower_id: 'MUM-POW-005' },
  { caller: '9865432178', callee: '9845671234', timestamp: '2024-03-12T10:00:00', duration: '180', tower_id: 'MUM-MLD-003' },
  { caller: '9845671234', callee: '9834567890', timestamp: '2024-03-13T09:15:00', duration: '150', tower_id: 'MUM-GOR-004' },
  { caller: '9876543210', callee: '9865432178', timestamp: '2024-03-13T16:30:00', duration: '300', tower_id: 'MUM-ANH-001' },
  { caller: '9854321098', callee: '9823456789', timestamp: '2024-03-14T11:00:00', duration: '240', tower_id: 'MUM-BAN-006' },
  { caller: '9876543210', callee: '9871234567', timestamp: '2024-03-14T13:45:00', duration: '90', tower_id: 'MUM-VIK-007' },
  { caller: '9865432178', callee: '9876543210', timestamp: '2024-03-15T06:00:00', duration: '30', tower_id: 'MUM-MLD-003' },
  { caller: '9876543210', callee: '9865432178', timestamp: '2024-03-15T06:05:00', duration: '15', tower_id: 'MUM-ANH-001' },
  { caller: '9876543210', callee: '9865432178', timestamp: '2024-03-15T06:15:00', duration: '20', tower_id: 'MUM-ANH-001' },
  { caller: '9876543210', callee: '9865432178', timestamp: '2024-03-15T06:30:00', duration: '10', tower_id: 'MUM-ANH-001' },
  { caller: '9876543210', callee: '9865432178', timestamp: '2024-03-15T06:45:00', duration: '25', tower_id: 'MUM-ANH-001' },
  { caller: '9865432178', callee: '9845671234', timestamp: '2024-03-15T08:00:00', duration: '60', tower_id: 'MUM-MLD-003' },
  { caller: '9845671234', callee: '9834567890', timestamp: '2024-03-15T08:30:00', duration: '45', tower_id: 'MUM-GOR-004' },
  { caller: '9812345678', callee: '9854321098', timestamp: '2024-03-16T22:00:00', duration: '5', tower_id: 'PUN-MG-001' },
  { caller: '9812345678', callee: '9876543210', timestamp: '2024-03-16T22:10:00', duration: '8', tower_id: 'PUN-MG-001' },
  { caller: '9812345678', callee: '9871234567', timestamp: '2024-03-16T22:15:00', duration: '3', tower_id: 'PUN-MG-001' },
  { caller: '9812345678', callee: '9865432178', timestamp: '2024-03-16T22:20:00', duration: '6', tower_id: 'PUN-MG-001' },
  { caller: '9812345678', callee: '9845671234', timestamp: '2024-03-16T22:30:00', duration: '4', tower_id: 'PUN-MG-001' },
  { caller: '9812345678', callee: '9834567890', timestamp: '2024-03-16T22:35:00', duration: '7', tower_id: 'PUN-MG-001' },
  { caller: '9812345678', callee: '9823456789', timestamp: '2024-03-16T22:40:00', duration: '5', tower_id: 'PUN-MG-001' },
  { caller: '9867891234', callee: '9871234567', timestamp: '2024-03-20T10:00:00', duration: '120', tower_id: 'THN-001' },
  { caller: '9867891234', callee: '9876543210', timestamp: '2024-03-20T14:00:00', duration: '90', tower_id: 'THN-001' },
  { caller: '9856789123', callee: '9867891234', timestamp: '2024-03-21T09:00:00', duration: '60', tower_id: 'THN-002' },
  { caller: '9856789123', callee: '9834567890', timestamp: '2024-03-21T11:00:00', duration: '45', tower_id: 'THN-002' },
  { caller: '9876543210', callee: '9867891234', timestamp: '2024-03-22T15:00:00', duration: '180', tower_id: 'MUM-ANH-001' },
  { caller: '9865432178', callee: '9867891234', timestamp: '2024-03-23T09:00:00', duration: '75', tower_id: 'MUM-MLD-003' },
];

const FINANCIAL_DATA = [
  { sender_account: '10234567890', receiver_account: '20345678901', sender_name: 'Rajesh Kumar', receiver_name: 'Priya Sharma', amount: '250000', timestamp: '2024-03-01T10:00:00', method: 'NEFT' },
  { sender_account: '20345678901', receiver_account: '30456789012', sender_name: 'Priya Sharma', receiver_name: 'Neha Gupta', amount: '49000', timestamp: '2024-03-02T11:30:00', method: 'IMPS' },
  { sender_account: '20345678901', receiver_account: '30456789012', sender_name: 'Priya Sharma', receiver_name: 'Neha Gupta', amount: '49000', timestamp: '2024-03-02T11:45:00', method: 'IMPS' },
  { sender_account: '20345678901', receiver_account: '30456789012', sender_name: 'Priya Sharma', receiver_name: 'Neha Gupta', amount: '49000', timestamp: '2024-03-02T12:00:00', method: 'IMPS' },
  { sender_account: '30456789012', receiver_account: '40567890123', sender_name: 'Neha Gupta', receiver_name: 'Deepak Malhotra', amount: '145000', timestamp: '2024-03-03T09:00:00', method: 'RTGS' },
  { sender_account: '40567890123', receiver_account: '10234567890', sender_name: 'Deepak Malhotra', receiver_name: 'Rajesh Kumar', amount: '100000', timestamp: '2024-03-05T14:00:00', method: 'NEFT' },
  { sender_account: '10234567890', receiver_account: '50678901234', sender_name: 'Rajesh Kumar', receiver_name: 'Ajay Deshmukh', amount: '300000', timestamp: '2024-03-06T16:00:00', method: 'RTGS' },
  { sender_account: '50678901234', receiver_account: '20345678901', sender_name: 'Ajay Deshmukh', receiver_name: 'Priya Sharma', amount: '200000', timestamp: '2024-03-07T10:00:00', method: 'NEFT' },
  { sender_account: '20345678901', receiver_account: '40567890123', sender_name: 'Priya Sharma', receiver_name: 'Deepak Malhotra', amount: '500000', timestamp: '2024-03-08T09:30:00', method: 'RTGS' },
  { sender_account: '40567890123', receiver_account: '50678901234', sender_name: 'Deepak Malhotra', receiver_name: 'Ajay Deshmukh', amount: '800000', timestamp: '2024-03-10T15:00:00', method: 'RTGS' },
  { sender_account: '30456789012', receiver_account: '20345678901', sender_name: 'Neha Gupta', receiver_name: 'Priya Sharma', amount: '75000', timestamp: '2024-03-11T11:00:00', method: 'IMPS' },
  { sender_account: '50678901234', receiver_account: '40567890123', sender_name: 'Ajay Deshmukh', receiver_name: 'Deepak Malhotra', amount: '150000', timestamp: '2024-03-12T14:00:00', method: 'NEFT' },
  { sender_account: '40567890123', receiver_account: '20345678901', sender_name: 'Deepak Malhotra', receiver_name: 'Priya Sharma', amount: '350000', timestamp: '2024-03-13T10:00:00', method: 'RTGS' },
  { sender_account: '20345678901', receiver_account: '10234567890', sender_name: 'Priya Sharma', receiver_name: 'Rajesh Kumar', amount: '180000', timestamp: '2024-03-14T12:00:00', method: 'NEFT' },
  { sender_account: '10234567890', receiver_account: '40567890123', sender_name: 'Rajesh Kumar', receiver_name: 'Deepak Malhotra', amount: '420000', timestamp: '2024-03-15T09:00:00', method: 'RTGS' },
  { sender_account: '40567890123', receiver_account: '30456789012', sender_name: 'Deepak Malhotra', receiver_name: 'Neha Gupta', amount: '95000', timestamp: '2024-03-16T16:00:00', method: 'IMPS' },
  { sender_account: '20345678901', receiver_account: '50678901234', sender_name: 'Priya Sharma', receiver_name: 'Ajay Deshmukh', amount: '275000', timestamp: '2024-03-17T11:00:00', method: 'NEFT' },
  { sender_account: '30456789012', receiver_account: '10234567890', sender_name: 'Neha Gupta', receiver_name: 'Rajesh Kumar', amount: '60000', timestamp: '2024-03-18T14:30:00', method: 'IMPS' },
];

// ============================================================
// SEED SCRIPT
// ============================================================

export async function seed({ closeOnComplete = false, connected = false } = {}) {
  console.log('🌱 Starting seed process...\n');

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/criminal_network';
  
  let mongod = null;
  if (!connected) {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
      console.log('✅ Connected to MongoDB (local)\n');
    } catch (err) {
      console.log('⚠️  Local MongoDB not available, using in-memory MongoDB...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri());
        console.log('✅ Connected to in-memory MongoDB\n');
      } catch (e2) {
        console.error('❌ Failed to start in-memory MongoDB:', e2.message);
        if (closeOnComplete) process.exit(1);
        throw e2;
      }
    }
  }

  // Clean existing data
  console.log('🗑️  Cleaning existing data...');
  await Promise.all([
    User.deleteMany({}),
    Case.deleteMany({}),
    Entity.deleteMany({}),
    Relationship.deleteMany({}),
    Pattern.deleteMany({}),
    DataSource.deleteMany({}),
  ]);

  // 1. Create users
  console.log('\n👤 Creating users...');
  const admin = await User.create({
    username: 'admin',
    email: 'admin@ncrb.gov.in',
    password: 'admin123',
    fullName: 'Commissioner Sharma',
    role: 'admin',
    badge: 'NCRB-001',
    department: 'Central Bureau',
  });

  const investigator = await User.create({
    username: 'investigator',
    email: 'inspector@ncrb.gov.in',
    password: 'invest123',
    fullName: 'Inspector Patel',
    role: 'investigator',
    badge: 'MUM-CIB-042',
    department: 'Mumbai Crime Branch',
  });

  console.log(`   ✓ Admin: ${admin.username} (password: admin123)`);
  console.log(`   ✓ Investigator: ${investigator.username} (password: invest123)`);

  // 2. Create case
  console.log('\n📂 Creating case...');
  const caseDoc = await Case.create({
    title: 'Operation Shadownet - Malhotra Syndicate Investigation',
    description: 'Multi-pronged investigation into the Malhotra criminal network operating across Mumbai, Pune, and Thane. Network involved in drug trafficking, extortion, money laundering, and illegal arms supply.',
    status: 'active',
    tags: ['drug-trafficking', 'extortion', 'money-laundering', 'arms', 'syndicate'],
    createdBy: admin._id,
    assignedTo: investigator._id,
  });
  console.log(`   ✓ Case: "${caseDoc.title}" (ID: ${caseDoc._id})`);

  // 3. Process FIR narratives (entity extraction)
  console.log('\n📄 Processing FIR narratives...');
  const allFIREntityNames = [];

  for (const fir of FIR_NARRATIVES) {
    console.log(`   Processing: ${fir.title}`);
    
    const ds = await DataSource.create({
      caseId: caseDoc._id,
      type: 'FIR',
      filename: fir.title,
      rawContent: fir.text,
      processed: true,
      uploadedBy: investigator._id,
    });

    const entities = extractEntities(fir.text, 'FIR', ds._id.toString());
    console.log(`   → Extracted ${entities.length} entities`);

    for (const entity of entities) {
      try {
        const existing = await Entity.findOne({ 
          caseId: caseDoc._id, name: entity.name, type: entity.type 
        });
        if (existing) {
          existing.aliases = [...new Set([...(existing.aliases || []), ...(entity.aliases || [])])];
          existing.confidence = Math.max(existing.confidence, entity.confidence);
          existing.sources.push(entity.source);
          await existing.save();
        } else {
          await Entity.create({
            caseId: caseDoc._id,
            name: entity.name,
            type: entity.type,
            aliases: entity.aliases || [],
            confidence: entity.confidence,
            sources: [entity.source],
          });
        }
        allFIREntityNames.push(entity.name);
      } catch (e) {
        if (e.code !== 11000) console.error(`   ⚠️  Error saving entity: ${e.message}`);
      }
    }
  }

  // Build co-occurrence relationships
  console.log('\n🔗 Building co-occurrence relationships from FIRs...');
  const uniqueNames = [...new Set(allFIREntityNames)];
  await buildCoOccurrenceRelationships(caseDoc._id, uniqueNames, 'FIR');

  // 4. Process CDR data
  console.log('\n📞 Processing CDR data...');
  const cdrDS = await DataSource.create({
    caseId: caseDoc._id,
    type: 'CDR',
    filename: 'call_records_march_2024.csv',
    parsedData: CDR_DATA,
    recordCount: CDR_DATA.length,
    processed: true,
    uploadedBy: investigator._id,
  });

  // Extract phone entities from CDR
  const cdrEntities = [];
  const phoneSet = new Set();
  for (const record of CDR_DATA) {
    if (!phoneSet.has(record.caller)) {
      phoneSet.add(record.caller);
      cdrEntities.push({
        name: record.caller, type: 'PHONE_NUMBER', confidence: 0.98,
        source: { sourceType: 'CDR', sourceId: cdrDS._id.toString(), extractedFrom: 'CDR' },
        aliases: [],
      });
    }
    if (!phoneSet.has(record.callee)) {
      phoneSet.add(record.callee);
      cdrEntities.push({
        name: record.callee, type: 'PHONE_NUMBER', confidence: 0.98,
        source: { sourceType: 'CDR', sourceId: cdrDS._id.toString(), extractedFrom: 'CDR' },
        aliases: [],
      });
    }
  }

  for (const entity of cdrEntities) {
    try {
      const existing = await Entity.findOne({
        caseId: caseDoc._id, name: entity.name, type: entity.type,
      });
      if (!existing) {
        await Entity.create({ caseId: caseDoc._id, ...entity, sources: [entity.source] });
      }
    } catch (e) {
      if (e.code !== 11000) console.error(`   ⚠️  Error: ${e.message}`);
    }
  }

  console.log(`   ✓ Processed ${CDR_DATA.length} call records, ${cdrEntities.length} phone entities`);

  // Build CDR relationships
  console.log('   Building call relationships...');
  const cdrRels = await buildCDRRelationships(caseDoc._id, CDR_DATA);
  console.log(`   ✓ Created ${cdrRels.length} call relationships`);

  // 5. Process Financial data
  console.log('\n💰 Processing financial transaction data...');
  const finDS = await DataSource.create({
    caseId: caseDoc._id,
    type: 'FINANCIAL',
    filename: 'transactions_march_2024.csv',
    parsedData: FINANCIAL_DATA,
    recordCount: FINANCIAL_DATA.length,
    processed: true,
    uploadedBy: investigator._id,
  });

  // Extract financial entities
  const accountSet = new Set();
  const nameSet = new Set();
  for (const record of FINANCIAL_DATA) {
    if (!accountSet.has(record.sender_account)) {
      accountSet.add(record.sender_account);
      try {
        const existing = await Entity.findOne({
          caseId: caseDoc._id, name: record.sender_account, type: 'ACCOUNT',
        });
        if (!existing) {
          await Entity.create({
            caseId: caseDoc._id, name: record.sender_account, type: 'ACCOUNT',
            confidence: 0.98, sources: [{ sourceType: 'FINANCIAL', sourceId: finDS._id.toString() }],
          });
        }
      } catch (e) {}
    }
    if (!accountSet.has(record.receiver_account)) {
      accountSet.add(record.receiver_account);
      try {
        const existing = await Entity.findOne({
          caseId: caseDoc._id, name: record.receiver_account, type: 'ACCOUNT',
        });
        if (!existing) {
          await Entity.create({
            caseId: caseDoc._id, name: record.receiver_account, type: 'ACCOUNT',
            confidence: 0.98, sources: [{ sourceType: 'FINANCIAL', sourceId: finDS._id.toString() }],
          });
        }
      } catch (e) {}
    }
    // Person entities from financial data (only if not already present)
    for (const name of [record.sender_name, record.receiver_name]) {
      if (name && !nameSet.has(name)) {
        nameSet.add(name);
        try {
          const existing = await Entity.findOne({
            caseId: caseDoc._id, name, type: 'PERSON',
          });
          if (!existing) {
            await Entity.create({
              caseId: caseDoc._id, name, type: 'PERSON',
              confidence: 0.9, sources: [{ sourceType: 'FINANCIAL', sourceId: finDS._id.toString() }],
            });
          }
        } catch (e) {}
      }
    }
  }

  console.log(`   ✓ Processed ${FINANCIAL_DATA.length} transactions`);

  // Build financial relationships
  console.log('   Building financial relationships...');
  const finRels = await buildFinancialRelationships(caseDoc._id, FINANCIAL_DATA);
  console.log(`   ✓ Created ${finRels.length} financial relationships`);

  // 6. Compute centrality metrics
  console.log('\n📊 Computing graph analytics...');
  const { metrics } = await computeCentralityMetrics(caseDoc._id);
  console.log(`   ✓ Computed centrality metrics for ${Object.keys(metrics).length} nodes`);

  // Show top influencers
  const sortedMetrics = Object.entries(metrics)
    .sort(([, a], [, b]) => b.influenceScore - a.influenceScore)
    .slice(0, 5);

  console.log('\n🏆 TOP 5 INFLUENCERS:');
  for (const [nodeId, data] of sortedMetrics) {
    console.log(`   ${data.label} (${data.type})`);
    console.log(`     Influence Score: ${(data.influenceScore * 100).toFixed(1)}%`);
    console.log(`     Degree: ${(data.degreeCentrality * 100).toFixed(1)}% | Betweenness: ${(data.betweennessCentrality * 100).toFixed(1)}% | PageRank: ${(data.pageRank * 100).toFixed(1)}%`);
  }

  // 7. Detect suspicious patterns
  console.log('\n🔍 Running pattern detection...');
  const patterns = await detectPatterns(caseDoc._id);
  console.log(`   ✓ Detected ${patterns.length} suspicious patterns\n`);

  console.log('🚨 DETECTED PATTERNS:');
  for (const pattern of patterns) {
    const severityEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    }[pattern.severity] || '⚪';
    console.log(`   ${severityEmoji} [${pattern.severity.toUpperCase()}] ${pattern.title}`);
    console.log(`     Score: ${pattern.score}/100 | Type: ${pattern.type}`);
    console.log(`     ${pattern.description.substring(0, 120)}...`);
    console.log();
  }

  // Update case counts
  const entityCount = await Entity.countDocuments({ caseId: caseDoc._id });
  const patternCount = patterns.length;
  await Case.findByIdAndUpdate(caseDoc._id, { entityCount, patternCount });

  // Summary
  const totalRels = await Relationship.countDocuments({ caseId: caseDoc._id });
  console.log('═══════════════════════════════════════════');
  console.log('📋 SEED SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`   Users:         2 (admin + investigator)`);
  console.log(`   Case:          "${caseDoc.title}"`);
  console.log(`   Data Sources:  ${FIR_NARRATIVES.length + 2} (${FIR_NARRATIVES.length} FIRs + CDR + Financial)`);
  console.log(`   Entities:      ${entityCount}`);
  console.log(`   Relationships: ${totalRels}`);
  console.log(`   Patterns:      ${patternCount}`);
  console.log('═══════════════════════════════════════════');
  console.log('\n✅ Seed complete! Run "npm run dev" to start the server.');
  console.log('   Login credentials:');
  console.log('   Admin:        admin / admin123');
  console.log('   Investigator: investigator / invest123\n');

  if (closeOnComplete) {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    process.exit(0);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  seed({ closeOnComplete: true }).catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

export default seed;
