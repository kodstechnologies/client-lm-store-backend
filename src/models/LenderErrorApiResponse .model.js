import mongoose from "mongoose";

const LenderErrorApiResponseSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
    },
    apiResponse: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true } 
);

export const LenderErrorApiResponse= mongoose.model('LenderErrorApiResponse', LenderErrorApiResponseSchema);
