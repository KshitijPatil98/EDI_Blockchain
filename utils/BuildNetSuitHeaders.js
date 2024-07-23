const OAuth = require("oauth-1.0a");
const crypto = require("crypto");
const netSuiteData = require("../config/netsuit");


// OAuth 1.0a configuration
const oauth = OAuth({
  consumer: {
    key: netSuiteData.CONSUMER_KEY,
    secret: netSuiteData.CONSUMER_SECRET,
  },
  // eslint-disable-next-line
  signature_method: netSuiteData.SIGNATURE_METHOD,
  // eslint-disable-next-line
  hash_function(base_string, key) {
    return crypto.createHmac("sha256", key).update(base_string).digest("base64");
  },
  realm: netSuiteData.REALM,
  // eslint-disable-next-line
  nonce_length: netSuiteData.NONCE_LENGHT,
  version: netSuiteData.VERSION
});

// const soOauth = OAuth({
//   consumer: {
//     key: netSuiteData.SO_CONSUMER_KEY,
//     secret: netSuiteData.SO_CONSUMER_SECRET,
//   },
//   // eslint-disable-next-line
//   signature_method: netSuiteData.SIGNATURE_METHOD,
//   // eslint-disable-next-line
//   hash_function(base_string, key) {
//     return crypto.createHmac("sha256", key).update(base_string).digest("base64");
//   },
//   realm: netSuiteData.REALM,
//   // eslint-disable-next-line
//   nonce_length: netSuiteData.NONCE_LENGHT,
//   version: netSuiteData.VERSION
// });

const token = {
  key: netSuiteData.ACCESS_TOKEN,
  secret: netSuiteData.ACCESS_TOKEN_SECRET,
}
// const soToken = {
//   key: netSuiteData.SO_ACCESS_TOKEN,
//   secret: netSuiteData.SO_ACCESS_TOKEN_SECRET
// };


module.exports = {
  oauth,
  token,
  // soOauth,
  // soToken
};