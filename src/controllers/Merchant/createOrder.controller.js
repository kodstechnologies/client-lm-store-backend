import sendSMSCustomerConsent from "../../services/sendSMSCustomerConsent.js";
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import EligibilityCheckOtpsModel from '../../models/EligibilityCheckOtps.model.js'
import { checkEligibilityWithFatakpay } from "../../Utils/fatakpayapi.js";
import { Customer } from "../../models/Customer.model.js";

export const sendOtpEligibilityCheck = async (req, res) => {
    const mobileNumberSchema = Joi.object({
        mobileNumber: Joi.string().required(),
    });

    const { error } = mobileNumberSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.message });
    }
    const { mobileNumber } = req.body;
    try {
        if (mobileNumber) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            const message = `${otp} is your one-time password(OTP) to check your loan eligibility on LittleMoney Portal`;

            await sendSMSCustomerConsent(mobileNumber, message);

            const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now

            const otpDoc = await EligibilityCheckOtpsModel.findOneAndUpdate(
                { mobileNumber },
                { mobileNumber, otp, otpExpiry },
                { upsert: true, new: true }
            );

            console.log("Saved OTP doc:", otpDoc);  // ✅ Add this line


            console.log(" OTP record saved/updated:", otpDoc);
            console.log("OTP saved for:", mobileNumber);
            console.log("Generated OTP:", otp);

            return res.status(200).json({
                success: true,
                message: mobileNumber,
                // otp: otp, 
            });
        }
    } catch (error) {
        console.error("Error in mobileVerify:", error);
        return res.status(500).json({ message: error.message || "Internal Server Error" });
    }

}
export const verifyOtpEligibilityCheck = async (req, res) => {
    const schema = Joi.object({
        mobileNumber: Joi.string().required(),
        otp: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const { mobileNumber, otp } = req.body;

    try {
        const record = await EligibilityCheckOtpsModel.findOne({ mobileNumber });

        if (!record) {
            return res.status(400).json({ message: 'No OTP sent to this number' });
        }

        if (Date.now() > Number(record.otpExpiry)) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        if (record.otp === otp) {
            // ✅ OTP matched — now check in Customer DB
            const customer = await Customer.findOne({ mobileNumber });

            console.log("🚀 ~ verifyOtpEligibilityCheck ~ customer:", customer)
            if (customer) {
                const isEligible = customer.eligibility_status === true;

                if (isEligible) {
                    const expiryDate = new Date(customer.data?.eligibility_expiry_date);
                    const now = new Date();

                    if (expiryDate < now) {
                        return res.status(200).json({
                            success: false,
                            message: "Eligibility expired",
                        });
                    }

                    return res.status(200).json({
                        success: true,
                        message: "Customer eligible",
                        max_eligibility_amount: customer.data?.max_eligibility_amount || 0,
                        max_amount:customer.data?.max_amount,
                        customerId: customer._id
                    });
                } else {
                    if (customer.message === "User already exists in the system.") {
                        return res.status(200).json({
                            success: true,
                            message: "Customer eligible with (User already exists in the system.)",
                            customerId: customer._id,
                            max_eligibility_amount: customer.data?.max_eligibility_amount || 3000,
                            max_amount:customer.data?.max_amount||10000,
                            tenure: customer.data?.tenure || 30
                        });
                    }

                    return res.status(200).json({
                        success: false,
                        message: "Customer not eligible",
                    });
                }
            }
            return res.status(200).json({
                success: true,
                message: "OTP verified successfully (new customer)",
            });

        } else {
            return res.status(400).json({ message: "Invalid OTP, please check again." });
        }

    } catch (err) {
        console.error("Server error:", err);
        return res.status(500).json({ message: 'Server error during OTP verification' });
    }

};


// export const checkCustomerEligibility = async (req, res) => {
//     const customerData = req.body;
//     try {
//         const result = await checkEligibilityWithFatakpay(customerData);

//         res.status(200).json({
//             success: true,
//             message: "Eligibility check completed",
//             data: result,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message || "Eligibility check failed",
//         });
//     }
// };

export const checkCustomerEligibility = async (req, res) => {
    const customerData = req.body;

    // Now storeId and merchantId come from the middleware
    const { storeId, merchantId } = req.store;
    console.log("🚀 ~ checkCustomerEligibility ~ storeId:", storeId)
    console.log("🚀 ~ checkCustomerEligibility ~ merchantId:", merchantId)

    try {
        const { dob_day, dob_month, dob_year, mobileNumber, ...rest } = customerData;

        const cleanedCustomerData = {
            ...rest,
            mobile: mobileNumber,
            consent: true,
            consent_timestamp: new Date(),
        };

        const result = await checkEligibilityWithFatakpay(cleanedCustomerData);

        const isEligible = result?.data?.eligibility_status === true;
        const userAlreadyExists = result?.message === "User already exists in the system.";
        const shouldProceed = isEligible || userAlreadyExists;

        const customerDoc = {
            mobileNumber: cleanedCustomerData.mobile,
            first_name: cleanedCustomerData.first_name,
            last_name: cleanedCustomerData.last_name,
            employment_type_id: cleanedCustomerData.employment_type_id || "Salaried",
            eligibility_status: isEligible,
            pan: cleanedCustomerData.pan,
            dob: cleanedCustomerData.dob,
            pincode: cleanedCustomerData.pincode,
            income: cleanedCustomerData.income,
            consent: cleanedCustomerData.consent,
            consent_timestamp: cleanedCustomerData.consent_timestamp,
            message: result.message || '',
            eligibility_expiry_date: result?.data?.eligibility_expiry_date,
            max_eligibility_amount: result?.data?.max_eligibility_amount,
            tenure: result?.data?.tenure || undefined,
            data: result?.data || result,
            ChainStoreId: merchantId,
            storeId: storeId,
        };
        console.log("🚀 ~ checkCustomerEligibility ~ customerDoc.ChainStoreId:", customerDoc.ChainStoreId)
        console.log("🚀 ~ checkCustomerEligibility ~ customerDoc.max_eligibility_amount:", customerDoc.max_eligibility_amount)

        if (!isEligible) {
            customerDoc.LenderErrorapiResponse = result;
        }

        const savedCustomer = await Customer.findOneAndUpdate(
            { mobileNumber: cleanedCustomerData.mobile },
            customerDoc,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        // Save to LenderErrorApiResponse ONLY if not eligible
        // if (!isEligible) {
        //     await LenderErrorApiResponse.create({
        //         mobileNumber: cleanedCustomerData.mobile,
        //         apiResponse: result,
        //     });
        // }

        return res.status(200).json({
            success: shouldProceed,
            message: customerDoc.message,
            data: savedCustomer,
            eligibleLoanAmount: customerDoc.data.max_amount,
            tenure:customerDoc.tenure
        });



    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message || "Eligibility check failed",
        });
    }

};

