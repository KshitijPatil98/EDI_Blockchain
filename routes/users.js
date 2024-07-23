var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  console.log(res.originalUrl);
  // res.status(500).send("yo")
  // res.send('respond with a resource');
  // throw new Error("yo")
});


module.exports = router;
