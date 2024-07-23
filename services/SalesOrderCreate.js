const axios = require("axios");
const fs = require("fs")
const nHeader = require("../utils/BuildNetSuitHeaders.js");
const logger = require("../lib/logger.js");
const netSuiteData = require("../config/netsuit.js");
const SDK = require("../config/sdk");
async function getTimeStamp() {
    // Get the current date and time
    const currentDate = new Date();

    // Extract year, month, day, hour, and minute
    const year = currentDate.getFullYear();
    const month = ('0' + (currentDate.getMonth() + 1)).slice(-2); // Adding 1 to month since it starts from 0
    const day = ('0' + currentDate.getDate()).slice(-2);
    const hours = ('0' + currentDate.getHours()).slice(-2);
    const minutes = ('0' + currentDate.getMinutes()).slice(-2);
    const seconds = ('0' + currentDate.getSeconds()).slice(-2);
    // Construct the timestamp string in the desired format
    const timestamp = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

    // Log the timestamp
    // console.log(timestamp);
    return (timestamp);

}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function createFile() {
    try {
        const purchaseOrderData = fs.readFileSync("/home/incalus/Desktop/incalus-project/soCreate/tmp/mynewdata.json").toString();
        // const purchaseOrderData = fs.readFileSync("/home/incalus/Desktop/incalus-project/soCreate/tmp/final-SO.json").toString();
        let purchaseOrderJsonData = JSON.parse(purchaseOrderData);
        // console.log("The purchase order data is", purchaseOrderJsonData);
        // An blockchain object which will be stored on the blockchain
        let blockchainObj = {
            internalID: `${purchaseOrderJsonData[0].CUSTOMER_ID}_${purchaseOrderJsonData[0].PO_NO}`,
            poNo: `${purchaseOrderJsonData[0].PO_NO}`,
            customerID: `${purchaseOrderJsonData[0].CUSTOMER_ID}`,
            poDate: `${purchaseOrderJsonData[0].DATE}`,
            fileCabinateTrace: {},
            salesOrderTrace: {},

        };
        // The SDK body for the blockchain
        let blockchainObject = {
            "userId": "user01",
            "channel": "manufacturersupplier",
            "chaincode": "edi",
            "peerName": "peer0.manufacturer.edi.com",
            "data": []
        };
        // data for the filecabinate API
        const fileCabinateData = [];
        // data for the sales order API
        const salesOrderData = [];

        // Addind the internal id for the identification whhich is the combination of Customer ID, Purchase order number and Purchase order line number
        for (let purchaseOrderLine of purchaseOrderJsonData) {
            purchaseOrderLine.internalID = `${purchaseOrderLine.CUSTOMER_ID}_${purchaseOrderLine.PO_NO}_${purchaseOrderLine.SO_LINE}`;
            // console.log("The line is: ", purchaseOrderLine)
            // pushing the attributes of the PO for creating file on file cabinate.
            if (purchaseOrderLine.ATTRIBUTES) {
                fileCabinateData.push({
                    "CUSTOMER_ID": purchaseOrderLine.CUSTOMER_ID,
                    "PO_NO": purchaseOrderLine.PO_NO,
                    "SO_LINE": purchaseOrderLine.SO_LINE,
                    "ATTRIBUTES": purchaseOrderLine.ATTRIBUTES
                });
            }
        }
        // console.log("The purchaseorder: ", fileCabinateData);
        // Generate OAuth headers dynamically
        const oauthHeaders = nHeader.oauth.toHeader(nHeader.oauth.authorize({
            url: netSuiteData.NETSUITE_URL,
            method: "POST"
        }, nHeader.token));

        // Combine OAuth headers with other headers
        const headers = {
            "Content-Type": "application/json",
            ...oauthHeaders
        };
        // const response = {
        //     data: {
        //         "status": "Failure",
        //         "message": "No line item has the attributes details"
        //     }
        // }
        // const response = {
        //     data: {
        //         "status": "Success",
        //         "file": [
        //             {
        //                 "soLine": "1",
        //                 "fileName": "C000001_POTEST_1.json",
        //                 "fileId": 20294,
        //                 "id": "C000001_POTEST_1"
        //             },
        //             {
        //                 "soLine": "2",
        //                 "fileName": "C000001_POTEST_2.json",
        //                 "fileId": 20295,
        //                 "id": "C000001_POTEST_2"
        //             },
        //             {
        //                 "soLine": "4",
        //                 "fileName": "C000001_POTEST_4.json",
        //                 "fileId": 20296,
        //                 "id": "C000001_POTEST_4"
        //             }
        //         ]
        //     }
        // }
        const response = await axios.post(netSuiteData.NETSUITE_URL, fileCabinateData, { headers });
        if (response.data.status === "Success") {
            const responseData = response.data.file;
            // console.log("Insisde if")
            for (const purchaseOrderLine of purchaseOrderJsonData) {
                const tmpObj = JSON.parse(JSON.stringify(purchaseOrderLine));
                for (const resObj of responseData) {
                    if (resObj.id === tmpObj.internalID) {
                        tmpObj.FILE_ID = resObj.fileId;
                        tmpObj.fileName = resObj.fileName;
                    }
                }
                delete tmpObj["ATTRIBUTES"]


                // console.log("In success: ", tmpObj);
                salesOrderData.push(tmpObj);
            }
            const temp = {
                "message": response.data.message,
                "sFlag": 1,
                "eFlag": 0,
                "timeStamp": await getTimeStamp(),
                fileID: responseData
            }
            blockchainObj.fileCabinateTrace = temp;


            /** */

            // Generate OAuth headers dynamically
            const oauthHeaders = nHeader.oauth.toHeader(nHeader.oauth.authorize({
                url: netSuiteData.SO_NETSUITE_URL,
                method: "POST"
            }, nHeader.token));

            // Combine OAuth headers with other headers
            const headers = {
                "Content-Type": "application/json",
                ...oauthHeaders
            };
            console.log("The sales order data is: ", salesOrderData);
            // return;
            try {
                const soResponse = await axios.post(netSuiteData.SO_NETSUITE_URL, salesOrderData, { headers });
                console.log("The soRespnse", soResponse)
                if (soResponse.data.status === "Success") {
                    // Success case for sales order.
                    const tmp = {
                        "message": "Success",
                        "sFlag": 1,
                        "eFlag": 0,
                        "timeStamp": await getTimeStamp(),
                        "salesOrderNumber": soResponse.data.recId
                    }
                    blockchainObj.salesOrderTrace = tmp;
                }
                else {
                    console.log("In the error state");
                    // error case for the sales order
                    const tmp = {
                        "message": soResponse.data.message,
                        "sFlag": 0,
                        "eFlag": 1,
                        "timeStamp": await getTimeStamp(),
                        soData: salesOrderData
                    }
                    blockchainObj.salesOrderTrace = tmp;

                }
                console.log("The bct obj: ", blockchainObj.salesOrderTrace);
                // return;
            }
            catch (error) {

                if (error.code === 'ECONNABORTED') {
                    let retryCount = 1;
                    const maxRetries = 4;

                    while (retryCount < maxRetries) {
                        try {
                            const retryResponse = await axios.post(netSuiteData.SO_NETSUITE_URL, salesOrderData, { headers });
                            console.log("The retry response is : ", retryResponse)
                            if (retryResponse.data.status == "Success") {

                                const tmp = {
                                    "message": "Success",
                                    "sFlag": 1,
                                    "eFlag": 0,
                                    "timeStamp": await getTimeStamp(),
                                    "salesOrderNumber": retryResponse.data.recId
                                }
                                blockchainObj.salesOrderTrace = tmp;
                                // call the sales order api
                                break;
                            }
                            else {
                                console.log("Retry, ", retryCount)
                                if (retryCount === maxRetries - 1) {
                                    const tmp = {
                                        "message": retryResponse.data.message,
                                        "sFlag": 0,
                                        "eFlag": 1,
                                        "timeStamp": await getTimeStamp(),
                                        soData: salesOrderData
                                    }
                                    blockchainObj.salesOrderTrace = tmp;
                                }
                                retryCount++;
                                await delay(10000); // Wait for 10 seconds before retrying
                            }

                        }
                        catch (error) {
                            if (retryCount === maxRetries - 1) {
                                if (error.code === 'ECONNABORTED') {
                                    const tmp = {
                                        "message": "Network Error: Request timeout",
                                        "sFlag": 0,
                                        "eFlag": 1,
                                        "timeStamp": await getTimeStamp(),
                                        soData: salesOrderData
                                    }
                                    blockchainObj.salesOrderTrace = tmp;
                                }
                            }
                            retryCount++;
                            await delay(10000); // Wait for 10 seconds before retrying
                        }
                    }



                }
                else {
                    console.log("The error in the sales order api: ", JSON.stringify(error));
                    const tmp = {
                        "message": "Internal Server Error",
                        "sFlag": 0,
                        "eFlag": 1,
                        "timeStamp": await getTimeStamp(),
                        soData: salesOrderData
                    }
                    blockchainObj.salesOrderTrace = tmp;
                }

            }
            /** */

            // call the blockchain to store the success data.
            const tmp = {
                "primaryKey": blockchainObj.internalID,
                "data": blockchainObj
            }
            blockchainObject.data.push(tmp)

            // console.log("The object for the SDK is ", JSON.stringify(blockchainObject));

            /** 
            // calling SDK
            const blockchainResponse = await axios.post(`${SDK.sdkURL}/generic/create`, blockchainObject, { "Content-Type": "application/json" });

            // console.log("The response is: ", blockchainResponse);
            if (blockchainResponse.status === 200) {
                // logger.info("Calling deleteData function");
                console.log("The blockchain response is : ", blockchainResponse.data.response)

                // call the API for the sales order. with the salesOrderData
            }
            else {
                // logger.error(`Error from the SDK while writing data on the BCT: ${blockchainResponse}`);
                throw new Error("Blockchian Api failed: ", blockchainResponse);
            }
                */
        }
        // Error in file cabinate.
        else {

            // retry the file cabinate api 3 times.
            let retryCount = 1;
            const maxRetries = 4;
            let retryResponse
            while (retryCount < maxRetries) {
                try {
                    retryResponse = await axios.post(netSuiteData.NETSUITE_URL, fileCabinateData, { headers });
                    // // if (retryCount === 2) {
                    // //     retryResponse = {
                    // //         data: {
                    // //             "status": "Success",
                    // //             "file": [
                    // //                 {
                    // //                     "soLine": "1",
                    // //                     "fileName": "C000001_POTEST_1.json",
                    // //                     "fileId": 20294,
                    // //                     "id": "C000001_POTEST_1"
                    // //                 },
                    // //                 {
                    // //                     "soLine": "2",
                    // //                     "fileName": "C000001_POTEST_2.json",
                    // //                     "fileId": 20295,
                    // //                     "id": "C000001_POTEST_2"
                    // //                 },
                    // //                 {
                    // //                     "soLine": "4",
                    // //                     "fileName": "C000001_POTEST_4.json",
                    // //                     "fileId": 20296,
                    // //                     "id": "C000001_POTEST_4"
                    // //                 }
                    // //             ]
                    // //         }
                    // //     }

                    // // }
                    // // else {
                    // retryResponse = {
                    //     data: {
                    //         "status": "Failure",
                    //         "message": "No line item has the attributes details"
                    //     }
                    // }
                    // // }
                    console.log("The retry response is : ", retryResponse)
                    if (retryResponse.data.status == "Success") {
                        const responseData = retryResponse.data.file;
                        // console.log("Insisde if", responseData)
                        const tmp = {
                            // "apiCall": retryCount + 1,
                            "message": retryResponse.data.message,
                            "sFlag": 1,
                            "eFlag": 0,
                            "timeStamp": await getTimeStamp(),
                            fileID: responseData
                        }
                        blockchainObj.fileCabinateTrace = tmp;
                        // return
                        // console.log("The blockchain object after success: ", JSON.stringify(blockchainObj), "\n\n\n\n", JSON.stringify(salesOrderData));
                        // call the sales order api
                        break;
                    }
                    else {
                        console.log("Retry, ", retryCount)
                        if (retryCount === maxRetries - 1) {
                            const tmp = {
                                // "apiCall": retryCount + 1,
                                "message": retryResponse.data.message,
                                "sFlag": 0,
                                "eFlag": 1,
                                "timeStamp": await getTimeStamp()
                            }
                            blockchainObj.fileCabinateTrace = tmp;
                        }
                        retryCount++;
                        await delay(10000); // Wait for 10 seconds before retrying
                    }

                }
                catch (error) {

                    console.log("API failed. Retrying")
                    if (retryCount === maxRetries - 1) {
                        if (error.code === 'ECONNABORTED') {
                            const tmp = {
                                // "apiCall": retryCount + 1,
                                "message": "Network Error: Request timeout",
                                "sFlag": 0,
                                "eFlag": 1,
                                "timeStamp": await getTimeStamp()
                            }
                            blockchainObj.fileCabinateTrace = tmp;
                        }
                    }
                    retryCount++;
                    await delay(10000); // Wait for 10 seconds before retrying
                }
            }
            // console.log("the blockchain obj", JSON.stringify(blockchainObj)) //"\n\n\n\n", purchaseOrderJsonData);

            const tmp = {
                "primaryKey": blockchainObj.internalID,
                "data": blockchainObj
            }
            blockchainObject.data.push(tmp)

            console.log("The object for the SDK is ", JSON.stringify(blockchainObject));

            // calling the SDK
            /** 
            const blockchainResponse = await axios.post(`${SDK.sdkURL}/generic/create`, blockchainObject, { "Content-Type": "application/json" });

            // console.log("The response is: ", blockchainResponse);
            if (blockchainResponse.status === 200) {
                // logger.info("Calling deleteData function");
                console.log("The blockchain response is : ", blockchainResponse.data.response)
                // call the API for the sales order. with the salesOrderData
            }
            else {
                // logger.error(`Error from the SDK while writing data on the BCT: ${blockchainResponse}`);
                throw new Error("Blockchian Api failed: ", blockchainResponse);
            }
                */
        }

        // console.log("The salesorderdata is: ", salesOrderData);
        // console.log("the blockchain obj", (blockchainObj)) //"\n\n\n\n", purchaseOrderJsonData);
    }
    catch (error) {
        console.log("The error occured", error);
    }
}

async function myFun() {
    await createFile();
}
myFun();