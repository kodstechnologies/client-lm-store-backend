import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  AccountId: { type: String, default: () => `ACID_${new mongoose.Types.ObjectId()}` },
  AccountName: { type: String, required: true },
  IFSCCode: { type: String },
  AccountNumber: { type: String },
  Description: { type: String },
  AuditFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

accountSchema.pre('save', function (next) {
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

export const Account = mongoose.model('Account', accountSchema);
