const Client = require("./Client.js");
const utils = require("./utils.js");

module.exports = {
  addSource: utils.addSource,
  authorizeSource: utils.authorizeSource,
  displayDiscoveryOutputForSource: utils.displayDiscoveryOutputForSource,
  selectStreamsForSource: utils.selectStreamsForSource
};
