import mongoose from 'mongoose';

const relationshipSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
  sourceEntityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity', required: true },
  targetEntityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity', required: true },
  sourceName: { type: String, required: true },
  targetName: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['CALL', 'TRANSACTION', 'CO_OCCURRENCE', 'LOCATION_SHARED', 'ASSOCIATE', 'FINANCIAL'],
    required: true 
  },
  weight: { type: Number, default: 1 },
  interactions: [{
    timestamp: Date,
    detail: String,
    sourceType: String,
  }],
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

relationshipSchema.index({ caseId: 1, sourceEntityId: 1, targetEntityId: 1, type: 1 });

export default mongoose.model('Relationship', relationshipSchema);
