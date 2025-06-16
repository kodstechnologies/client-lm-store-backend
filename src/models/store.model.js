import mongoose from 'mongoose';
import { applyAuditMiddleware } from '../Utils/auditFieldsHelper.js';

const storeSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  StoreCode: { type: String, unique: true }, // LMS_100_1000
  Phone: { type: String, required: true, unique: true },
  Email: { type: String },
  Address: { type: String },
  State: { type: String },
  GSTIN: { type: String },
  AccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  AffiliateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliate' },
  ChainStoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChainStore', required: true },
  ifscCode: { type: String },
  pinCode: { type: String },
  LoginCount: { type: Number, default: 0 },
  LastLoginDate: { type: Date },

  accountNumber: { type: String },
  IsActive: { type: Boolean, default: true },
  chequePhoto: { type: String },
  shopPhoto: { type: String },
  gstCertificate: { type: String },
  AuditFields: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

applyAuditMiddleware(storeSchema);

// Auto-generate StoreCode
storeSchema.pre('validate', async function (next) {
  if (this.isNew && !this.StoreCode) {
    const chainStore = await mongoose.model('ChainStore').findById(this.ChainStoreId);
    if (!chainStore || !chainStore.NumericId) {
      return next(new Error('ChainStore or its NumericId not found'));
    }

    const count = await mongoose.model('Store').countDocuments({ ChainStoreId: this.ChainStoreId });
    const storeNumber = 1000 + count; // LMS_100_1000, LMS_100_1001, etc.
    this.StoreCode = `LMS_${chainStore.NumericId}_${storeNumber}`;
  }
  next();
});

export const Store = mongoose.model('Store', storeSchema);
