import sendSMSCustomerConsent from "../../services/sendSMSCustomerConsent.js";
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import EligibilityCheckOtpsModel from '../../models/EligibilityCheckOtps.model.js'
import { checkEligibilityWithFatakpay } from "../../Utils/fatakpayapi.js";
import { Customer } from "../../models/Customer.model.js";
import OrdersModel from "../../models/Orders.model.js";
const REDIRECTION_URL = process.env.REDIRECTION_URL
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

            console.log("Saved OTP doc:", otpDoc);  // Add this line


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
    const { storeId } = req.store || {};
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

            console.log("🚀 ~ verifyOtpEligibilityCheck ~ customer:", customer);

            if (customer) {
                // ✅ 1. Check for QR Generated order first
                let QRGeneratedOrder = await OrdersModel.findOne({
                    number: mobileNumber,
                    status: "QR Generated",
                    storeId: storeId
                }).sort({ createdAt: -1 }); // Get latest
                console.log("🚀 ~ verifyOtpEligibilityCheck ~ QRGeneratedOrder:", QRGeneratedOrder)

                if (QRGeneratedOrder) {
                    const newOrderId = `LMO_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
                    const newQrUrl = `${REDIRECTION_URL}/order/${newOrderId}`;

                    //  Update the order
                    QRGeneratedOrder.orderId = newOrderId;
                    QRGeneratedOrder.qrUrl = newQrUrl;
                    await QRGeneratedOrder.save();

                    return res.status(200).json({
                        success: true,
                        message: "OTP verified successfully (existing customer with updated QR Generated order)",
                        isNewCustomer: false,

                        status: QRGeneratedOrder.status,
                        Order: QRGeneratedOrder,
                        qrUrl: newQrUrl
                    });
                }

                // 2. Check for Completed order
                const completedOrder = await OrdersModel.findOne({
                    customerId: customer._id,
                    status: "Completed",
                    storeId: storeId
                }).sort({ createdAt: -1 });
                console.log("🚀 ~ verifyOtpEligibilityCheck ~ completedOrder:", completedOrder)

                if (completedOrder) {
                    return res.status(200).json({
                        success: true,
                        message: "OTP verified successfully (returning customer with completed order)",
                        isNewCustomer: false,
                        status: completedOrder.status,
                        Order: completedOrder,
                        qrUrl: completedOrder.qrUrl
                    });
                }

                // ✅ 3. Continue with eligibility check...
                const isEligible = customer.eligibility_status === true;
                console.log("🚀 ~ verifyOtpEligibilityCheck ~ isEligible:", isEligible)

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
                        max_amount: customer.data?.max_amount,
                        tenure: customer.data?.tenure || 12,
                        customerId: customer._id,
                        status: customer.status
                    });
                } else {
                    if (customer.message === "User already exists in the system.") {
                        console.log("🚀 ~ verifyOtpEligibilityCheck ~ customer.message:", customer.message)
                        return res.status(200).json({
                            success: true,
                            message: "Customer eligible with (User already exists in the system.)",
                            customerId: customer._id,
                            max_eligibility_amount: customer.data?.max_eligibility_amount || 3000,
                            max_amount: customer.data?.max_amount || 10000,
                            tenure: customer.data?.tenure || 30
                        });
                    }

                    return res.status(200).json({
                        customerDetails: customer,
                        customerId: customer._id,
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

// export const checkCustomerEligibility = async (req, res) => {
//     const customerData = req.body;
//     const { storeId, merchantId } = req.store;

//     try {
//         const { dob_day, dob_month, dob_year, mobileNumber, ...rest } = customerData;

//         const cleanedCustomerData = {
//             ...rest,
//             mobile: mobileNumber,
//             consent: true,
//             consent_timestamp: new Date(),
//         };

//         const result = await checkEligibilityWithFatakpay(cleanedCustomerData);

//         const isEligible = result?.data?.eligibility_status === true;
//         const userAlreadyExists = result?.message === "User already exists in the system.";
//         const shouldProceed = isEligible || userAlreadyExists;

//         const baseCustomerDoc = {
//             mobileNumber: cleanedCustomerData.mobile,
//             first_name: cleanedCustomerData.first_name,
//             last_name: cleanedCustomerData.last_name,
//             employment_type_id: cleanedCustomerData.employment_type_id || "Salaried",
//             eligibility_status: isEligible,
//             pan: cleanedCustomerData.pan,
//             dob: cleanedCustomerData.dob,
//             pincode: cleanedCustomerData.pincode,
//             income: cleanedCustomerData.income,
//             consent: cleanedCustomerData.consent,
//             consent_timestamp: cleanedCustomerData.consent_timestamp,
//             message: result.message || '',
//             eligibility_expiry_date: result?.data?.eligibility_expiry_date,
//             max_eligibility_amount: result?.data?.max_eligibility_amount,
//             tenure: result?.data?.tenure || undefined,
//             data: result?.data || result,
//             ChainStoreId: merchantId,
//             storeId: storeId,
//         };

//         if (!isEligible) {
//             baseCustomerDoc.LenderErrorapiResponse = result;
//         }

//         const existingCustomer = await Customer.findOne({ mobileNumber: cleanedCustomerData.mobile });

//         let savedCustomer;

//         if (existingCustomer) {
//             const hasCompletedOrder = await OrdersModel.findOne({
//                 customerId: existingCustomer._id,
//                 status: 'Completed',
//             });

//             if (hasCompletedOrder) {
//                 // ✅ Create a new customer document
//                 const newCustomer = new Customer(baseCustomerDoc);
//                 savedCustomer = await newCustomer.save();
//             } else {
//                 // ✅ Update the existing customer document
//                 savedCustomer = await Customer.findByIdAndUpdate(
//                     existingCustomer._id,
//                     baseCustomerDoc,
//                     { new: true }
//                 );
//             }
//         } else {
//             // No customer exists — create new
//             const newCustomer = new Customer(baseCustomerDoc);
//             savedCustomer = await newCustomer.save();
//         }

//         return res.status(200).json({
//             success: shouldProceed,
//             message: baseCustomerDoc.message,
//             data: savedCustomer,
//             eligibleLoanAmount: baseCustomerDoc.data?.max_amount,
//             tenure: baseCustomerDoc.tenure
//         });

//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             success: false,
//             message: error.message || "Eligibility check failed",
//         });
//     }
// };
export const checkCustomerEligibility = async (req, res) => {
    const customerData = req.body;
    const { storeId, merchantId } = req.store;

    try {
        const { dob_day, dob_month, dob_year, mobileNumber, ...rest } = customerData;

        const cleanedCustomerData = {
            ...rest,
            mobile: mobileNumber,
            consent: true,
            consent_timestamp: new Date(),
        };

        const result = await checkEligibilityWithFatakpay(cleanedCustomerData);
        console.log("🚀 ~ checkCustomerEligibility ~ result:", result)

        const isEligible = result?.data?.eligibility_status === true || result.eligibility_status === true;
        console.log("🚀 ~ checkCustomerEligibility ~ isEligible:", isEligible)
        const userAlreadyExists = result?.message === "User already exists in the system.";
        const shouldProceed = isEligible || userAlreadyExists;

        const baseCustomerDoc = {
            mobileNumber: cleanedCustomerData.mobile,
            first_name: cleanedCustomerData.first_name,
            last_name: cleanedCustomerData.last_name,
            employment_type_id: cleanedCustomerData.employment_type_id || "Salaried",
            eligibility_status: [
                {
                    storeId: storeId,
                    isEligible: isEligible
                }
            ],
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

        if (!isEligible) {
            baseCustomerDoc.LenderErrorapiResponse = result;
        }


        const existingCustomer = await Customer.findOne({ mobileNumber: cleanedCustomerData.mobile });

        let savedCustomer;

        if (existingCustomer) {
            const hasCompletedOrder = await OrdersModel.findOne({
                customerId: existingCustomer._id,
                status: 'Completed',
                storeId: storeId
            });

            if (hasCompletedOrder) {
                //  Create a new customer document
                const newCustomer = new Customer(baseCustomerDoc);
                savedCustomer = await newCustomer.save();
            } else {
                // Update fields and eligibility_status array
                const storeExists = existingCustomer.eligibility_status.some(
                    (entry) => entry.storeId.toString() === storeId.toString()
                );

                if (!storeExists) {
                    existingCustomer.eligibility_status.push({
                        storeId: storeId,
                        isEligible: isEligible
                    });
                } else {
                    // Optional: update isEligible value if needed
                    const storeEntry = existingCustomer.eligibility_status.find(
                        (entry) => entry.storeId.toString() === storeId.toString()
                    );
                    storeEntry.isEligible = isEligible;
                }

                // Update other fields
                existingCustomer.first_name = cleanedCustomerData.first_name;
                existingCustomer.last_name = cleanedCustomerData.last_name;
                existingCustomer.employment_type_id = cleanedCustomerData.employment_type_id || "Salaried";
                existingCustomer.pan = cleanedCustomerData.pan;
                existingCustomer.dob = cleanedCustomerData.dob;
                existingCustomer.pincode = cleanedCustomerData.pincode;
                existingCustomer.income = cleanedCustomerData.income;
                existingCustomer.consent = true;
                existingCustomer.consent_timestamp = new Date();
                existingCustomer.message = result.message || '';
                existingCustomer.eligibility_expiry_date = result?.data?.eligibility_expiry_date;
                existingCustomer.max_eligibility_amount = result?.data?.max_eligibility_amount;
                existingCustomer.tenure = result?.data?.tenure || undefined;
                existingCustomer.data = result?.data || result;
                existingCustomer.ChainStoreId = merchantId;
                existingCustomer.storeId = storeId;
              

                if (!isEligible) {
                    existingCustomer.LenderErrorapiResponse = result;
                }

                savedCustomer = await existingCustomer.save();
            }
        }
        else {
            // No customer exists — create new
            const newCustomer = new Customer(baseCustomerDoc);
            savedCustomer = await newCustomer.save();
        }
        console.log("🚀 ~ checkCustomerEligibility ~ savedCustomer:", savedCustomer)

        return res.status(200).json({
            success: shouldProceed,
            message: baseCustomerDoc.message,
            data: savedCustomer,
            eligibleLoanAmount: baseCustomerDoc.data?.max_amount,
            tenure: baseCustomerDoc.tenure
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message || "Eligibility check failed",
        });
    }
};