import mongoose from 'mongoose';

const patternSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
  type: { 
    type: String, 
    enum: [
      'CALL_FREQUENCY_SPIKE',
      'CIRCULAR_TRANSACTION',
      'NEW_CONNECTION',
      'BURNER_PHONE',
      'HIGH_VALUE_TRANSFER',
      'RAPID_TRANSACTIONS',
      'UNUSUAL_TIMING',
    ],
    required: true 
  },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  score: { type: Number, default: 0, min: 0, max: 100 },
  title: { type: String, required: true },
  description: { type: String, required: true },
  involvedEntities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Entity' }],
  involvedEntityNames: [String],
  evidence: { type: mongoose.Schema.Types.Mixed, default: {} },
  acknowledged: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Pattern', patternSchema);
