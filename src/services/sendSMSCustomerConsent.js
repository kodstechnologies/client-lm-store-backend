import axios from 'axios'
import { SMS_AUTH_KEY, SMS_SENDERID, TEMPLATE_ID_CUSTOMER_CONSENT } from "../config/index.js";

const sendSMSCustomerConsent = async (mobileNumber, message) => {
    try {
        const data = JSON.stringify({
            message: message,
            senderId: SMS_SENDERID,
            number: mobileNumber,
            templateId: TEMPLATE_ID_CUSTOMER_CONSENT,
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
export default sendSMSCustomerConsent