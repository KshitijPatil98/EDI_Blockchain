const errorDataService = require("../services/ErrorDataService");

const errorData = async (req, res) => {
    await errorDataService.getQueryData(req, res);
}

module.exports = {
    errorData
}