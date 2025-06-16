import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    mobileNumber: {
        type: String,
        required: true,
        // unique: true,
        trim: true
    },
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true
    },
    employment_type_id: {
        type: String,
        default: 'Salaried',
        enum: ['Salaried'] // restricts it to only 'Salaried'
    },
    eligibility_status: [
        {
            storeId: { type: String},
            isEligible: { type: Boolean }
        }
    ]
,
    pan: {
        type: String,
        required: true,
        // unique: true,
        uppercase: true,
        match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    },
    dob: {
        type: Date,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    income: {
        type: Number,
        required: true
    },
    consent: {
        type: Boolean,
        default: false
    },
    consent_timestamp: {
        type: Date
    },
    message: {
        type: String
    },

    max_eligibility_amount: {
        type: String
    },
    eligibility_expiry_date: {
        type: Date
    },
    tenure: {
        type: Number
    },
    data: {
        type: mongoose.Schema.Types.Mixed
    },
    ChainStoreId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    LenderErrorapiResponse: {
        type: mongoose.Schema.Types.Mixed,
        // required: true,
    },
    status: {
        type: String,
        default:null
    }
}, {
    timestamps: true
});
export const Customer = mongoose.model('Customer', customerSchema)