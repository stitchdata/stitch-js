const Client = require("./Client.js");
const utils = require("./utils.js");

module.exports = {
  addSourceIntegration: utils.addSourceIntegration,
  authorizeSourceIntegration: utils.authorizeSourceIntegration,
  runCheckForSourceIntegration: utils.runCheckForSourceIntegration,
  selectFieldsForSourceIntegration: utils.selectFieldsForSourceIntegration
};
