import mongoose from 'mongoose';

const storeGroupSchema = new mongoose.Schema({
  GroupId: { type: String, default: () => `GRID_${new mongoose.Types.ObjectId()}` },
  Name: { type: String, required: true },
  Phone: { type: String },
  Email: { type: String },
  IsActive: { type: Boolean, default: true },
  Description: { type: String },
  AuditFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

storeGroupSchema.pre('save', function (next) {
  const now = new Date();
  if (this.isNew) {
    this.AuditFields = {
      createdBy: 'system',
      createdAt: now
    };
  } else {
    this.AuditFields = {
      ...(this.AuditFields || {}),
      updatedBy: 'system',
      updatedAt: now
    };
  }
  next();
});

export const StoreGroup = mongoose.model('StoreGroup', storeGroupSchema);
