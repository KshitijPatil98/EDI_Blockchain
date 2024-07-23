const axios = require("axios");
const SDK = require("../config/sdk");
const getFormattedDate = (date) => {
    const dateArr = date.split("-");
    const formattedDate = `${dateArr[2]}-${dateArr[0]}-${dateArr[1]}`;
    return formattedDate;
};
const getLastSeventhDayDate = () => {

    const currentDate = new Date();
    // Calculate the date of the last 7th day
    const lastSeventhDay = new Date();
    lastSeventhDay.setDate(currentDate.getDate() - 7);
    // Format the date as YYYY/MM/DD
    const formattedDate = `${lastSeventhDay.getFullYear()}-${(lastSeventhDay.getMonth() + 1).toString().padStart(2, "0")}-${lastSeventhDay.getDate().toString().padStart(2, "0")}`;
    // console.log(formattedDate);
    return formattedDate;


};
const getQueryData = async (req, res) => {
    const { poNum, customerId, status, fromDate, toDate } = req.body;
    const lastSevernDays = []
    const selectorQuery = {
        "selector": {
            // "$or": [
            //     {
            //         "salesOrderTrace": {
            //             "$elemMatch": {
            //                 "eFlag": 1
            //             }
            //         }
            //     },
            //     {
            //         "fileCabinateTrace": {
            //             "$elemMatch": {
            //                 "eFlag": 1
            //             }
            //         }
            //     }
            // ]
        }
    }
    if (poNum != undefined && poNum.length > 0) {
        lastSevernDays.push(0);
        selectorQuery.selector.poNo = poNum
    }
    if (customerId != undefined && customerId.length > 0) {
        lastSevernDays.push(1)
        selectorQuery.selector.customerID = customerId
    }
    if (status != undefined && status === 0) {
        lastSevernDays.push(2)
        selectorQuery.selector["$or"] = [
            {
                "salesOrderTrace.eFlag": status
            },
            {
                "fileCabinateTrace.eFlag": status
            }
        ]
    }
    else if (status != undefined && status === 1) {
        lastSevernDays.push(3)
        selectorQuery.selector["$or"] = [
            {
                "salesOrderTrace.eFlag": status
            },
            {
                "fileCabinateTrace.eFlag": status
            }
        ]
    }
    if (fromDate != undefined && fromDate.length > 0) {
        lastSevernDays.push(4)
        const inDate = getFormattedDate(fromDate);
        selectorQuery.selector.poDate = {
            $gte: inDate
        }
    }
    if (toDate != undefined && toDate.length > 0) {
        lastSevernDays.push(5)
        const inDate = getFormattedDate(toDate);
        selectorQuery.selector.poDate = {
            ...selectorQuery.selector.poDate,
            $lte: inDate
        }
    }
    if (lastSevernDays.length === 0) {
        selectorQuery.selector.poDate = {
            $gte: getLastSeventhDayDate(),
        };
    }
    console.log("The sekector query", selectorQuery);
    const queryBody = {

        "userId": "user01",
        "channel": "manufacturersupplier",
        "chaincode": "edi",
        "peerName": "peer0.manufacturer.edi.com",
        queryString: JSON.stringify(selectorQuery)
    };
    const response = await axios.post(`${SDK.sdkURL}/generic/queryString`, queryBody, { headers: { "Content-Type": "application/json" } });
    // console.log("The response is: ", response.data);
    if (response.data.status === 200) {
        const resData = {
            status: 200,
            message: "Query successful.",
            data: JSON.parse(response.data.data),
            errorMessage: ""
        };
        console.log("The lenght of the res array is: ", JSON.parse((response.data.data)).length);
        res.send(resData);
    }
    else {
        res.status(502).send(
            {
                status: 502,
                message: "Error occured at application level",
                data: [],
                errorMessage: `Failed to submit transaction. Please contact system administrator. Error: ${response.data.errorMessage}`
            });
    }
}

module.exports = {
    getQueryData
}