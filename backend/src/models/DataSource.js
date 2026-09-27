import mongoose from 'mongoose';

const dataSourceSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
  type: { 
    type: String, 
    enum: ['FIR', 'CDR', 'FINANCIAL', 'SURVEILLANCE', 'SOCIAL_MEDIA'],
    required: true 
  },
  filename: String,
  rawContent: String,
  parsedData: { type: mongoose.Schema.Types.Mixed },
  recordCount: { type: Number, default: 0 },
  processed: { type: Boolean, default: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('DataSource', dataSourceSchema);
