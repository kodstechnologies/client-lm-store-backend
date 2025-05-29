import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    // ref: 'Customer',
    required: true
  },
  status: {
    type: String,
    enum: ['QR Generated', 'Completed', 'Processed', 'On Hold', 'Settled', 'Rejected'],
    default: 'QR Generated'  // default status 
  },
  name: {
    type: String
  },
  number: {
    type: String
  },
  eligibleAmount: {
    type: Number
  },
  qrUrl: {
    type: String
  },
},
 {
  timestamps: true
});
orderSchema.pre('save', function (next) {
  if (this.isNew && !this.orderId) {
    const shortNum = Math.floor(10000 + Math.random() * 90000);
    this.orderId = `LMO_${shortNum}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);