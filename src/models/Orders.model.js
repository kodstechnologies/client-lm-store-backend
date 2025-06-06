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
  },
  storeId: {
    type: String,
  },
  chainStoreId: {
    type: String,
  },
  name: {
    type: String
  },
  number: {
    type: String,
    unique:true
  },
  eligibleAmount: {
    type: Number
  },
  max_amount:{
    type:String
  },
  eligibility_expiry_date: {
    type: Date
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
    const date = new Date();
    // const formattedDate = date.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD //${formattedDate}
    const time = date.getTime().toString(); // timestamp in ms as string
    const shortTime = time.slice(); 
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    this.orderId = `LMO_${shortTime}_${randomPart}`;
  }
  next();
});



export default mongoose.model('Order', orderSchema);