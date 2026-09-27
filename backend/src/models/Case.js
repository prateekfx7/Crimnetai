import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['open', 'active', 'closed'], default: 'open' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  entityCount: { type: Number, default: 0 },
  patternCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Case', caseSchema);
