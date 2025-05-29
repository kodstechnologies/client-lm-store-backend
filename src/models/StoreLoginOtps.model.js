import mongoose from 'mongoose'
const storeLoginOtpSchema = new mongoose.Schema({
    mobileNumber: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: false
    },
    otpExpiry: {
        type: String,
        required: false
    },
    Date: {
        type: Date,
        default: Date.now
    },
},
    {
        timestamps: true
    })
export default mongoose.model('storeLoginOtp', storeLoginOtpSchema)