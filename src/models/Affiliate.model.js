import mongoose from 'mongoose';

const affiliateSchema = new mongoose.Schema({
  AffiliateId: { type: String, default: () => `AFID_${new mongoose.Types.ObjectId()}` },
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

affiliateSchema.pre('save', function (next) {
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

export const Affiliate = mongoose.model('Affiliate', affiliateSchema);
