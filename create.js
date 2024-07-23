const fs = require("fs")
let data = JSON.parse((fs.readFileSync("tmp/MV_EDI_API_208Lines_Failure.json")).toString());

let finalData = []
for (let i = 0; i < 208; i++) {
    let tmp = data.customFields[i];
    tmp.ATTRIBUTES = data.Attributes[i];
    tmp.customFields = {
        "ProductLine": "ACCW",
        "Finish": "PAINTED",
        "OrderType": "AW850",
        "Pattern": "COL",
        "UnitSize": "1880",
        "ExteriorColor": "WH",
        "InteriorColor": "PR",
        "Type": "EXTR"
    }
    finalData.push(tmp);
    tmp = {}
}


fs.writeFileSync("tmp/mydata.txt", JSON.stringify(finalData))