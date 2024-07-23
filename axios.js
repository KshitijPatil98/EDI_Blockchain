const axios = require("axios");
const axiosRetry = require('axios-retry');

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8295/', // Replace with your API base URL
    timeout: 10000, // Timeout in milliseconds (adjust as needed)
    retry: {
        retries: 3, // Number of retries
        retryDelay: 2, // No automatic retry delay
        shouldRetry: error => true // Function to determine whether to retry
    }
});
axiosRetry.axiosRetry(axiosInstance, {
    retries: 3, // Number of retries
    retryDelay: axiosRetry.exponentialDelay, // Exponential backoff retry delay
    retryCondition: (error) => {
        // Function to determine whether to retry (returns true to retry)
        // Retry on network errors and 5xx server responses
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response.status >= 500;
    },
});
async function myfun() {
    try {
        const response = await axiosInstance.get('/users'); // Replace with your API endpoint
        console.log('API call succeeded:', response);
        return; // Exit function if API call succeeds
    } catch (error) {
        console.error('API call failed:', error);
    }
}
myfun()
