import axios from 'axios';
const CREATE_USER_TOKEN_URL = process.env.CREATE_USER_TOKEN_URL
const EMI_INSURANCE_ELIGIBILITY_URL = process.env.EMI_INSURANCE_ELIGIBILITY_URL

//to get token
// utils/fatakpayApi.js
const FATAKPAY_USERNAME = process.env.FATAKPAY_USERNAME
const FATAKPAY_PASSWORD = process.env.FATAKPAY_PASSWORD


export async function getFatakpayToken() {

    try {
        const res = await axios.post(
            CREATE_USER_TOKEN_URL,
            {
                username: FATAKPAY_USERNAME,
                password: FATAKPAY_PASSWORD
            }
        );


        if (res.data?.success && res.data?.data?.token) {
            return res.data.data.token;
        } else {
            throw new Error(res.data?.message || 'Token not received');
        }
    } catch (err) {
        console.error("Eligibility check failed:", {
            message: err.message,
            responseData: err.response?.data,
            status: err.response?.status,
            headers: err.response?.headers,
        });

        throw new Error("Failed to check eligibility from Fatakpay.");
    }
}


// export async function getFatakpayToken() {
//     // TEMPORARY hardcoded token for development/testing
//     return "cac6f18a65ae287d3d9fe7e2455d4da8e567e7d4";
// }


//to check eleigibility
export async function checkEligibilityWithFatakpay(cleanedCustomerData) {
    const token = await getFatakpayToken(); // Always generate new token
    console.log("Fatakpay token:", token);
    console.log("Customer data for eligibility:", cleanedCustomerData);

    try {
        const res = await axios.post(
            EMI_INSURANCE_ELIGIBILITY_URL,
            cleanedCustomerData,
            {
                headers: {
                    Authorization: `Token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }

            }
        );

        return res.data;
    } catch (error) {
        console.error("Eligibility check failed:", {
            message: error.message,
            responseData: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
        });
        throw new Error("Failed to check eligibility from Fatakpay.");
    }

}
