import { Merchant } from "../../models/Merchant.model.js";
import otpModel from "../../models/otp.model.js";
import { Store } from "../../models/store.model.js";
import sendSMS from "../../services/sendSMS.js";
import Joi from "joi";
// import Joi from 'Joi';
import jwt from 'jsonwebtoken';
import StoreLoginOtpsModel from "../../models/StoreLoginOtps.model.js";


export const mobileVerify = async (req, res) => {
  const mobileVerifySchema = Joi.object({
    mobileNumber: Joi.string().required(),
  });

  const { error } = mobileVerifySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const { mobileNumber } = req.body;

  try {
    //  Check if store exists
    const store = await Store.findOne({ Phone: mobileNumber });

    if (!store) {
      return res.status(404).json({ message: 'Mobile number not registered as a Store' });
    }

    //  Check if store is active
    if (!store.IsActive) {
      return res.status(403).json({ message: 'Store is not active. OTP cannot be sent.' });
    }

    //  Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("🚀 ~ mobileVerify ~ otp:", otp);

    const message = `${otp} is your OTP to login to LittleMoney portal.`;

    await sendSMS(mobileNumber, message);

    const otpExpiry = Date.now() + 5 * 60 * 1000;

    const otpDoc = await StoreLoginOtpsModel.findOneAndUpdate(
      { mobileNumber },
      { mobileNumber, otp, otpExpiry },
      { upsert: true, new: true }
    );

    console.log("OTP record saved/updated:", otpDoc);
    console.log("OTP saved for:", mobileNumber);
    console.log("Generated OTP:", otp);

    return res.status(200).json({
      success: true,
      message: mobileNumber,
      // otp: otp, // Uncomment this line only for testing
    });
  } catch (error) {
    console.error("Error in mobileVerify:", error);
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};




// export const verifyOtp = async (req, res) => {
//   const schema = Joi.object({
//     mobileNumber: Joi.string().required(),
//     otp: Joi.string().required(),
//   });

//   const { error } = schema.validate(req.body);
//   if (error) return res.status(400).json({ message: error.message });

//   const { mobileNumber, otp } = req.body;

//   try {
//     const record = await otpModel.findOne({ mobileNumber });
//     if (!record) {
//       return res.status(400).json({ message: 'No OTP sent to this number' });
//     }

//     if (Date.now() > Number(record.otpExpiry)) {
//       return res.status(400).json({ message: 'OTP expired' });
//     }

//     if (record.otp == otp) {

//       // ✅ Find the merchant
//       const merchant = await Merchant.findOne({ Phone: mobileNumber });
//       let merchantIsActive = null;

//       if (merchant) {
//         // Update merchant's login count and last login date
//         merchant.LoginCount += 1;
//         merchant.LastLoginDate = new Date();
//         await merchant.save();
//         merchantIsActive = merchant.IsActive;
//       } else {
//         return res.status(400).json({ message: 'Merchant not found' });
//       }

//       // ✅ Generate JWT token for Merchant
//       const merchantToken = jwt.sign(
//         { merchantId: merchant._id, phoneNumber: merchant.Phone },
//         process.env.JWT_SECRET,
//         { expiresIn: "30m" }
//       );

//       return res.status(200).json({
//         success: true,
//         message: "OTP verified successfully for Merchant",
//         token: merchantToken, // Returning Merchant JWT token
//         isActive: merchantIsActive, // Returning IsActive status
//         merchantId: merchant._id,
//         lastLoginDate: merchant.LastLoginDate,
//         loginCount: merchant.LoginCount,
//       });

//     } else {
//       return res.status(400).json({ message: "Invalid OTP, please check again." });
//     }

//   } catch (err) {
//     console.error("Server error:", err);
//     return res.status(500).json({ message: 'Server error during OTP verification' });
//   }
// };


export const verifyOtp = async (req, res) => {
  const schema = Joi.object({
    mobileNumber: Joi.string().required(),
    otp: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const { mobileNumber, otp } = req.body;

  try {
    const record = await StoreLoginOtpsModel.findOne({ mobileNumber });
    if (!record) return res.status(400).json({ message: 'No OTP sent to this number' });

    if (Date.now() > Number(record.otpExpiry)) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP, please check again." });
    }


    const store = await Store.findOne({ Phone: mobileNumber }).populate({ path: 'ChainStoreId' });

    console.log("🚀 ~ verifyOtp ~ store:", store)
    if (!store) {
      return res.status(400).json({ message: 'Store not found' });
    }
    const merchantId = store.ChainStoreId && store.ChainStoreId._id ? store.ChainStoreId._id : store.ChainStoreId;
    // //  Check Store status
    // if (!store.IsActive) {
    //   return res.status(403).json({
    //     success: false,
    //     isActive: false,
    //     message: 'Store is not active',
    //   });
    // }

    store.LoginCount += 1;
    store.LastLoginDate = new Date();
    await store.save();

    const storeToken = jwt.sign(
      {
        storeId: store._id,
        phoneNumber: store.Phone,
        storeName: store.Name,
        merchantId,
        isActive: store.IsActive,
      },
      process.env.JWT_SECRET
    );
    // console.log("🚀 ~ verifyOtp ~ ChainStoreId:", ChainStoreId)
    console.log("🚀 ~ verifyOtp ~ storeToken:", storeToken)

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully for Store',
      userType: 'store',
      token: storeToken,
      isActive: store.IsActive,
      storeId: store._id,
      storeName: store.Name,
      storeEmail: store.Email,
      storePhone: store.Phone,
      storeMerchant: store.ChainStoreId?._id || null,
      storeMerchantName: store.ChainStoreId?.Name || null,
      StoreCode: store.StoreCode,
      lastLoginDate: store.LastLoginDate,
      loginCount: store.LoginCount,
      // chainStoreId:store.
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ message: 'Server error during OTP verification' });
  }
};
