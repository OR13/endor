const decodeJwt = require("./decodeJwt");
const documentLoader = require("./documentLoader");

const help = () => {
  console.log("For demonstration purposes only.");
};

module.exports = { help, decodeJwt, documentLoader };
