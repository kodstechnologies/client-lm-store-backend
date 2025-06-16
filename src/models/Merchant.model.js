import mongoose from 'mongoose';
import { applyAuditMiddleware } from '../Utils/auditFieldsHelper.js';

const chainStoreSchema = new mongoose.Schema({
  // GroupId: { type: String, default: () => `GRID_${new mongoose.Types.ObjectId()}` },

  Name: { type: String, required: true },
  Address: { type: String, required: false },
  Phone: { type: String, required: true, unique: true },
  Email: { type: String, required: false },
  State: { type: String, required: false },
  GSTIN: { type: String, required: false },
  Description: { type: String, required: false },

  //   GroupId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'StoreGroup',
  //   required: false,
  // },
  //   AffiliateId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Affiliate',
  //   required: false,
  // },
  //   AccountId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Account',
  //   required: false,
  // },

  LastLoginDate: { type: Date },
  IsActive: { type: Boolean, default: true },

  AuditFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  }
}, {
  timestamps: true
});

applyAuditMiddleware(chainStoreSchema)


export const Merchant = mongoose.model('ChainStore', chainStoreSchema);
