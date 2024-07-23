const express = require("express");
const router = express.Router();

const errorDataController = require("../controllers/ErrorDataController");

router.post("/getErrorData", errorDataController.errorData);

module.exports = router;
