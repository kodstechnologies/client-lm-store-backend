import mongoose from 'mongoose'

const eligibilityCheckOtpsSchema = mongoose.Schema({
    mobileNumber: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: false
    },
    otpExpiry: {
        type: Date,   // <-- Changed here
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

export default mongoose.model('EligibilityCheckOtp', eligibilityCheckOtpsSchema);
