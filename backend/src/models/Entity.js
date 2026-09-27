import mongoose from 'mongoose';

const entitySchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['PERSON', 'PHONE_NUMBER', 'LOCATION', 'ORGANIZATION', 'VEHICLE_NO', 'ACCOUNT'],
    required: true 
  },
  aliases: [String],
  confidence: { type: Number, default: 1.0, min: 0, max: 1 },
  sources: [{
    sourceType: { type: String, enum: ['FIR', 'CDR', 'FINANCIAL', 'SURVEILLANCE', 'SOCIAL_MEDIA'] },
    sourceId: String,
    extractedFrom: String,
  }],
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  influenceScore: { type: Number, default: 0 },
  degreeCentrality: { type: Number, default: 0 },
  betweennessCentrality: { type: Number, default: 0 },
  pageRank: { type: Number, default: 0 },
  flagged: { type: Boolean, default: false },
  flagReason: String,
}, { timestamps: true });

entitySchema.index({ caseId: 1, name: 1, type: 1 }, { unique: true });

export default mongoose.model('Entity', entitySchema);
