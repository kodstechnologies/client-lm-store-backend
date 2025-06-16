import axios from "axios";
import { SMS_AUTH_KEY, SMS_SENDERID, TEMPLATE_ID_STORE_LOGIN } from "../config/index.js";

const sendSMS = async (mobileNumber, message) => {
  try {
    const data = JSON.stringify({
      message: message,
      senderId: SMS_SENDERID,
      number: mobileNumber,
      templateId: TEMPLATE_ID_STORE_LOGIN,
    });

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://smsapi.edumarcsms.com/api/v1/sendsms",
      headers: {
        "Content-Type": "application/json",
        APIKEY: SMS_AUTH_KEY,
      },
      data: data,
    };

    const response = await axios.request(config);
    console.log(response.data);

    if (response.status === 200) {
      console.log("SMS sent successfully!");
      console.log(response.data);
    } else {
      console.error("Failed to send SMS:", response.data);
    }
  } catch (error) {
    console.error(
      "Error while sending SMS:",
      error.response ? error.response.data : error.message
    );
  }
};
// sendSMS(
//     "9765652199",
//     "555555 is your OTP to login to LittleMoney portal"
// );
export default sendSMS;
