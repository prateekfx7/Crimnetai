export const MOCK_CASE = {
  _id: 'demo-case-001',
  title: 'Operation Shadownet - Malhotra Syndicate Investigation',
  description: 'Multi-pronged investigation into the Malhotra criminal network operating across Mumbai, Pune, and Thane. Network involved in drug trafficking, extortion, money laundering, and illegal arms supply.',
  status: 'active',
  tags: ['drug-trafficking', 'extortion', 'money-laundering', 'arms', 'syndicate'],
  createdAt: '2024-03-15T09:00:00.000Z'
};

export const MOCK_STATS = {
  entityCount: 60,
  relationshipCount: 433,
  patternCount: 12,
  highRiskCount: 6,
  byType: {
    PERSON: 14,
    PHONE_NUMBER: 16,
    LOCATION: 18,
    ORGANIZATION: 4,
    VEHICLE_NO: 4,
    BANK_ACCOUNT: 4
  }
};

export const MOCK_INFLUENCERS = [
  { _id: 'node-1', name: 'Deepak Malhotra', type: 'PERSON', influenceScore: 0.94, degreeCentrality: 0.88, betweennessCentrality: 0.96, pageRank: 0.92, riskLevel: 'CRITICAL' },
  { _id: 'node-2', name: 'Sunil Yadav', type: 'PERSON', influenceScore: 0.89, degreeCentrality: 0.85, betweennessCentrality: 0.91, pageRank: 0.87, riskLevel: 'HIGH' },
  { _id: 'node-3', name: 'Priya Sharma', type: 'PERSON', influenceScore: 0.84, degreeCentrality: 0.78, betweennessCentrality: 0.89, pageRank: 0.82, riskLevel: 'HIGH' },
  { _id: 'node-4', name: 'Rajesh Kumar', type: 'PERSON', influenceScore: 0.81, degreeCentrality: 0.79, betweennessCentrality: 0.82, pageRank: 0.78, riskLevel: 'HIGH' },
  { _id: 'node-5', name: 'Vikram Singh', type: 'PERSON', influenceScore: 0.77, degreeCentrality: 0.72, betweennessCentrality: 0.79, pageRank: 0.74, riskLevel: 'MEDIUM' },
  { _id: 'node-6', name: 'Ajay Deshmukh', type: 'PERSON', influenceScore: 0.73, degreeCentrality: 0.69, betweennessCentrality: 0.74, pageRank: 0.71, riskLevel: 'MEDIUM' },
  { _id: 'node-7', name: 'Firoz Khan', type: 'PERSON', influenceScore: 0.68, degreeCentrality: 0.65, betweennessCentrality: 0.70, pageRank: 0.66, riskLevel: 'MEDIUM' },
  { _id: 'node-8', name: 'Ravi Patil', type: 'PERSON', influenceScore: 0.63, degreeCentrality: 0.61, betweennessCentrality: 0.64, pageRank: 0.61, riskLevel: 'MEDIUM' }
];

export const MOCK_PATTERNS = [
  {
    _id: 'pat-1',
    caseId: 'demo-case-001',
    type: 'CALL_FREQUENCY_SPIKE',
    severity: 'HIGH',
    title: 'Pre-Incident Call Spike Detected',
    description: 'Sudden spike of 5 calls within 45 minutes between 9876543210 (Rajesh Kumar) and 9865432178 (Sunil Yadav) just prior to the Andheri warehouse raid.',
    confidence: 0.95,
    involvedEntityIds: [
      { _id: 'phone-1', name: '9876543210 (Rajesh Kumar)', type: 'PHONE_NUMBER' },
      { _id: 'phone-2', name: '9865432178 (Sunil Yadav)', type: 'PHONE_NUMBER' }
    ],
    evidence: { callCount: 5, timeWindow: '45 mins', ratio: 4.8 },
    detectedAt: '2024-03-15T07:00:00.000Z'
  },
  {
    _id: 'pat-2',
    caseId: 'demo-case-001',
    type: 'BURNER_PHONE',
    severity: 'HIGH',
    title: 'Short-Lived Burner SIM Active at MG Road',
    description: 'Number 9812345678 made 5 calls to key syndicate leaders in 30 minutes, then ceased all transmission activity permanently.',
    confidence: 0.92,
    involvedEntityIds: [
      { _id: 'phone-burner', name: '9812345678', type: 'PHONE_NUMBER' }
    ],
    evidence: { activeDurationHours: 1.5, callCount: 5, isDiscarded: true },
    detectedAt: '2024-03-16T23:00:00.000Z'
  },
  {
    _id: 'pat-3',
    caseId: 'demo-case-001',
    type: 'FINANCIAL_STRUCTURING',
    severity: 'HIGH',
    title: 'Smurfing / Structuring Pattern in Hawala Trail',
    description: 'Repeated transactions of Rs. 49,000 deposited within 2 hours between Neha Gupta and Priya Sharma to evade regulatory thresholds (Rs. 50,000).',
    confidence: 0.97,
    involvedEntityIds: [
      { _id: 'acc-1', name: 'A/C 20345678901 (HDFC)', type: 'BANK_ACCOUNT' },
      { _id: 'acc-2', name: 'A/C 30456789012 (ICICI)', type: 'BANK_ACCOUNT' }
    ],
    evidence: { transactionCount: 4, averageAmount: 49000, totalAmount: 196000 },
    detectedAt: '2024-03-17T11:30:00.000Z'
  },
  {
    _id: 'pat-4',
    caseId: 'demo-case-001',
    type: 'MULTI_SIM_DEVICE',
    severity: 'MEDIUM',
    title: 'Co-Located Phone Operations (Dual SIMs)',
    description: 'Simultaneous tower pings recorded for numbers 9876543210 and 9871234567 across MUM-ANH-001 and MUM-JUH-002 towers.',
    confidence: 0.86,
    involvedEntityIds: [
      { _id: 'phone-1', name: '9876543210', type: 'PHONE_NUMBER' },
      { _id: 'phone-3', name: '9871234567', type: 'PHONE_NUMBER' }
    ],
    evidence: { towerOverlapCount: 6, primaryTower: 'MUM-ANH-001' },
    detectedAt: '2024-03-18T14:00:00.000Z'
  }
];

export const MOCK_ENTITIES = [
  { _id: 'node-1', name: 'Deepak Malhotra', type: 'PERSON', confidence: 0.98, aliases: ['Boss', 'Bade Bhai'], degreeCentrality: 0.88, betweennessCentrality: 0.96, pageRank: 0.92, influenceScore: 0.94, sources: ['FIR #4521', 'FIR #4589', 'Surveillance'] },
  { _id: 'node-2', name: 'Sunil Yadav', type: 'PERSON', confidence: 0.95, aliases: ['Logistics Head'], degreeCentrality: 0.85, betweennessCentrality: 0.91, pageRank: 0.87, influenceScore: 0.89, sources: ['FIR #4521', 'FIR #4589', 'CDR'] },
  { _id: 'node-3', name: 'Priya Sharma', type: 'PERSON', confidence: 0.94, aliases: ['Accountant'], degreeCentrality: 0.78, betweennessCentrality: 0.89, pageRank: 0.82, influenceScore: 0.84, sources: ['FIR #4612', 'Bank Records'] },
  { _id: 'node-4', name: 'Rajesh Kumar', type: 'PERSON', confidence: 0.96, aliases: ['Kumar'], degreeCentrality: 0.79, betweennessCentrality: 0.82, pageRank: 0.78, influenceScore: 0.81, sources: ['FIR #4521', 'Seizure Memo'] },
  { _id: 'node-5', name: 'Vikram Singh', type: 'PERSON', confidence: 0.91, aliases: ['Vicky'], degreeCentrality: 0.72, betweennessCentrality: 0.79, pageRank: 0.74, influenceScore: 0.77, sources: ['FIR #4521', 'FIR #4650'] },
  { _id: 'node-6', name: 'Ajay Deshmukh', type: 'PERSON', confidence: 0.89, aliases: ['Supplier'], degreeCentrality: 0.69, betweennessCentrality: 0.74, pageRank: 0.71, influenceScore: 0.73, sources: ['FIR #4650', 'Arms Recovery'] },
  { _id: 'node-7', name: 'Firoz Khan', type: 'PERSON', confidence: 0.87, aliases: ['Farhan Khan'], degreeCentrality: 0.65, betweennessCentrality: 0.70, pageRank: 0.66, influenceScore: 0.68, sources: ['FIR #4589'] },
  { _id: 'node-8', name: 'Ravi Patil', type: 'PERSON', confidence: 0.85, aliases: ['Lookout'], degreeCentrality: 0.61, betweennessCentrality: 0.64, pageRank: 0.61, influenceScore: 0.63, sources: ['FIR #4589', 'FIR #4650'] },
  { _id: 'phone-1', name: '9876543210', type: 'PHONE_NUMBER', confidence: 0.99, aliases: ['Rajesh Mobile'], degreeCentrality: 0.75, betweennessCentrality: 0.80, pageRank: 0.76, influenceScore: 0.78, sources: ['CDR', 'FIR #4521'] },
  { _id: 'phone-2', name: '9865432178', type: 'PHONE_NUMBER', confidence: 0.99, aliases: ['Sunil Mobile'], degreeCentrality: 0.74, betweennessCentrality: 0.78, pageRank: 0.75, influenceScore: 0.77, sources: ['CDR', 'FIR #4589'] },
  { _id: 'phone-burner', name: '9812345678', type: 'PHONE_NUMBER', confidence: 0.92, aliases: ['Burner Phone'], degreeCentrality: 0.58, betweennessCentrality: 0.72, pageRank: 0.60, influenceScore: 0.65, sources: ['CDR'] },
  { _id: 'loc-1', name: 'Andheri West, Mumbai', type: 'LOCATION', confidence: 0.92, aliases: ['Warehouse Raid'], degreeCentrality: 0.55, betweennessCentrality: 0.60, pageRank: 0.56, influenceScore: 0.58, sources: ['FIR #4521'] },
  { _id: 'loc-2', name: 'Pune MG Road', type: 'LOCATION', confidence: 0.90, aliases: ['Syndicate HQ'], degreeCentrality: 0.58, betweennessCentrality: 0.65, pageRank: 0.60, influenceScore: 0.62, sources: ['FIR #4612'] },
  { _id: 'org-1', name: 'Greenfield Enterprises', type: 'ORGANIZATION', confidence: 0.93, aliases: ['Shell Co 1'], degreeCentrality: 0.52, betweennessCentrality: 0.58, pageRank: 0.53, influenceScore: 0.55, sources: ['FIR #4612'] },
  { _id: 'veh-1', name: 'MH02AB1234', type: 'VEHICLE_NO', confidence: 0.95, aliases: ['White Innova'], degreeCentrality: 0.48, betweennessCentrality: 0.51, pageRank: 0.49, influenceScore: 0.50, sources: ['FIR #4521'] },
  { _id: 'acc-1', name: 'A/C 10234567890 (BOI)', type: 'BANK_ACCOUNT', confidence: 0.96, aliases: ['Hawala Inflow'], degreeCentrality: 0.45, betweennessCentrality: 0.50, pageRank: 0.46, influenceScore: 0.48, sources: ['Financial'] }
];

export const MOCK_NETWORK = {
  nodes: [
    { id: 'node-1', name: 'Deepak Malhotra', type: 'PERSON', val: 32, influence: 0.94, color: '#ef4444' },
    { id: 'node-2', name: 'Sunil Yadav', type: 'PERSON', val: 26, influence: 0.89, color: '#ef4444' },
    { id: 'node-3', name: 'Priya Sharma', type: 'PERSON', val: 24, influence: 0.84, color: '#ef4444' },
    { id: 'node-4', name: 'Rajesh Kumar', type: 'PERSON', val: 22, influence: 0.81, color: '#f59e0b' },
    { id: 'node-5', name: 'Vikram Singh', type: 'PERSON', val: 20, influence: 0.77, color: '#f59e0b' },
    { id: 'node-6', name: 'Ajay Deshmukh', type: 'PERSON', val: 18, influence: 0.73, color: '#f59e0b' },
    { id: 'node-7', name: 'Firoz Khan', type: 'PERSON', val: 16, influence: 0.68, color: '#f59e0b' },
    { id: 'node-8', name: 'Ravi Patil', type: 'PERSON', val: 15, influence: 0.63, color: '#10b981' },
    { id: 'phone-1', name: '9876543210 (Rajesh)', type: 'PHONE_NUMBER', val: 16, influence: 0.78, color: '#3b82f6' },
    { id: 'phone-2', name: '9865432178 (Sunil)', type: 'PHONE_NUMBER', val: 16, influence: 0.77, color: '#3b82f6' },
    { id: 'phone-burner', name: '9812345678 (Burner)', type: 'PHONE_NUMBER', val: 14, influence: 0.65, color: '#8b5cf6' },
    { id: 'loc-1', name: 'Andheri West', type: 'LOCATION', val: 13, influence: 0.58, color: '#06b6d4' },
    { id: 'loc-2', name: 'Pune MG Road', type: 'LOCATION', val: 14, influence: 0.62, color: '#06b6d4' },
    { id: 'org-1', name: 'Greenfield Enterprises', type: 'ORGANIZATION', val: 14, influence: 0.55, color: '#ec4899' },
    { id: 'veh-1', name: 'MH02AB1234', type: 'VEHICLE_NO', val: 12, influence: 0.50, color: '#eab308' },
    { id: 'acc-1', name: 'A/C 10234567890', type: 'BANK_ACCOUNT', val: 12, influence: 0.48, color: '#14b8a6' }
  ],
  links: [
    { source: 'node-1', target: 'node-2', type: 'DIRECTS', weight: 5 },
    { source: 'node-1', target: 'node-3', type: 'CONTROLS_FINANCES', weight: 5 },
    { source: 'node-1', target: 'node-5', type: 'COMMUNICATED_WITH', weight: 4 },
    { source: 'node-2', target: 'node-4', type: 'COORDINATES_WITH', weight: 5 },
    { source: 'node-2', target: 'node-7', type: 'DISPATCHES', weight: 4 },
    { source: 'node-2', target: 'phone-2', type: 'OWNS_DEVICE', weight: 3 },
    { source: 'node-4', target: 'phone-1', type: 'OWNS_DEVICE', weight: 3 },
    { source: 'phone-1', target: 'phone-2', type: 'CALL_VOLUME_HIGH', weight: 5 },
    { source: 'phone-burner', target: 'node-1', type: 'BURNER_CONTACT', weight: 4 },
    { source: 'phone-burner', target: 'node-3', type: 'BURNER_CONTACT', weight: 4 },
    { source: 'node-3', target: 'org-1', type: 'BENEFICIAL_OWNER', weight: 4 },
    { source: 'org-1', target: 'acc-1', type: 'ACCOUNT_HOLDER', weight: 4 },
    { source: 'node-4', target: 'veh-1', type: 'OPERATES_VEHICLE', weight: 3 },
    { source: 'veh-1', target: 'loc-1', type: 'TRACKED_AT', weight: 3 },
    { source: 'node-1', target: 'loc-2', type: 'MEETS_AT', weight: 4 },
    { source: 'node-5', target: 'node-6', type: 'RECEIVES_WEAPONS', weight: 4 },
    { source: 'node-6', target: 'node-8', type: 'SUPPLIES', weight: 3 },
    { source: 'node-7', target: 'node-8', type: 'OPERATES_WITH', weight: 3 }
  ]
};
