(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Stitch = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _EVENT_TYPES = require("./EVENT_TYPES.js");

var _EVENT_TYPES2 = _interopRequireDefault(_EVENT_TYPES);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HOST = "http://app.stitchdata.test:8088" || "https://app.stitchdata.com";
var ROOT = HOST + "/v2/js-client";
var log = undefined === "true" ? console.log : function () {};

var KNOWN_MESSAGE_TYPES = Object.keys(_EVENT_TYPES2.default).map(function (key) {
  return _EVENT_TYPES2.default[key];
});

var StitchClient = function () {
  function StitchClient() {
    var _this = this;

    var context = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, StitchClient);

    this._childWindow = null;
    this._initialized = false;
    this._context = context;
    this._subscribers = [];
    window.addEventListener("message", function (event) {
      if (event.source === _this._childWindow) {
        _this._onMessage(event.data);
      }
    });
  }

  _createClass(StitchClient, [{
    key: "subscribe",
    value: function subscribe(callback) {
      var _this2 = this;

      var unlisten = function unlisten() {
        _this2._subscribers = _this2._subscribers.filter(function (_callback) {
          return callback !== callback;
        });
      };
      this._subscribers.push(callback);
      return unlisten;
    }
  }, {
    key: "_emit",
    value: function _emit(event) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this._subscribers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var subscriber = _step.value;

          subscriber(event);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }

    // The child window sends an event when closed, but if the window is closed
    // from outside the Stitch app (during the OAuth flow, for example), this
    // event won't be sent. So, check the window status every second.

  }, {
    key: "_pollForChildWindowClosed",
    value: function _pollForChildWindowClosed() {
      var _this3 = this;

      window.setTimeout(function () {
        if (_this3._childWindow) {
          if (_this3._childWindow.closed) {
            _this3._windowClosed();
          } else {
            _this3._pollForChildWindowClosed();
          }
        }
      }, 1000);
    }
  }, {
    key: "_windowClosed",
    value: function _windowClosed() {
      log("event: closed");
      this._childWindow = null;
      this._initialized = false;
      this._emit({ type: "closed" });
    }
  }, {
    key: "_onMessage",
    value: function _onMessage(event) {
      if (event.type === _EVENT_TYPES2.default.BOOTSTRAP) {
        log("event: initialized");
        this._initialized = true;
        this._sendContext();
      } else if (event.type === _EVENT_TYPES2.default.CLOSED) {
        this._windowClosed();
      } else if (KNOWN_MESSAGE_TYPES.indexOf(event.type) >= 0) {
        log("event", event);
        this._emit(event);
      } else {
        log("event: [WARNING] unknown message type", event);
      }
    }
  }, {
    key: "_sendContext",
    value: function _sendContext() {
      if (!this._initialized || this._childWindow.closed) {
        return this.initialize();
      }
      log("send context", this._context);
      this._childWindow.postMessage({
        type: "update",
        data: this._context
      }, "*");
    }
  }, {
    key: "setContext",
    value: function setContext(context) {
      this._content = context;
      this._sendContext();
    }
  }, {
    key: "initialize",
    value: function initialize() {
      var context = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      log("initialize");
      this._context = context;
      if (this._childWindow) {
        this._childWindow.close();
      }
      this._initialized = false;
      this._childWindow = window.open(ROOT);
      this._pollForChildWindowClosed();
    }
  }, {
    key: "close",
    value: function close() {
      log("close");
      if (this._childWindow) {
        this._childWindow.close();
      }
    }
  }]);

  return StitchClient;
}();

exports.default = StitchClient;

},{"./EVENT_TYPES.js":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Object.freeze({
  BOOTSTRAP: "bootstrap",
  CLOSED: "closed",
  CONNECTION_AUTHORIZED: "connectionAuthorized",
  CONNECTION_CREATED: "connectionCreated",
  CONNECTION_UPDATED: "connectionUpdated",
  ERROR_AUTHORIZING_CONNCTION: "errorAuthorizingConnection",
  ERROR_LOADING_CONNECTION: "errorLoadingConnection",
  INTEGRATION_FORM_CLOSE: "integrationFormClose"
});

},{}],3:[function(require,module,exports){
"use strict";

var Client = require("./Client.js");
var utils = require("./utils.js");

module.exports = {
  addSource: utils.addSource,
  authorizeSource: utils.authorizeSource,
  displayDiscoveryOutputForSource: utils.displayDiscoveryOutputForSource,
  selectStreamsForSource: utils.selectStreamsForSource
};

},{"./Client.js":1,"./utils.js":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.STEPS = undefined;
exports.addSource = addSource;
exports.authorizeSource = authorizeSource;
exports.displayDiscoveryOutputForSource = displayDiscoveryOutputForSource;
exports.selectStreamsForSource = selectStreamsForSource;

var _Client = require("./Client.js");

var _Client2 = _interopRequireDefault(_Client);

var _EVENT_TYPES = require("./EVENT_TYPES.js");

var _EVENT_TYPES2 = _interopRequireDefault(_EVENT_TYPES);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var STEPS = exports.STEPS = {
  CREATE: "CREATE",
  AUTHORIZE: "AUTHORIZE",
  CHECK: "CHECK",
  SELECT_FIELDS: "SELECT_FIELDS"
};

function getCreateContext(baseContext, options) {
  if (!options.type) {
    throw new Error("You must specify `options.type`");
  }
  return Object.assign(baseContext, {
    targetState: {
      name: "app.connections.create",
      params: {
        route: options.type
      }
    }
  });
}

function assertOptionsId(options) {
  if (!options.id) {
    throw new Error("You must specify `options.id`");
  }
}

function getAuthorizeContext(baseContext, options) {
  assertOptionsId(options);
  return Object.assign(baseContext, {
    targetState: {
      name: "app.connections.details.authorize",
      params: {
        id: options.id
      }
    }
  });
}

function getCheckContext(baseContext, options) {
  assertOptionsId(options);
  if (!options.checkJobName) {
    throw new Error("You must specify `options.checkJobName`");
  }
  return Object.assign(baseContext, {
    targetState: {
      name: "app.connections.details.check",
      params: {
        id: options.id,
        check_job_name: options.check_job_name
      }
    }
  });
}

function getSelectFieldsContext(baseContext, options) {
  assertOptionsId(options);
  return Object.assign(baseContext, {
    targetState: {
      name: "app.connections.details.fields",
      params: {
        id: options.id
      }
    }
  });
}

function getContext(baseContext, step, options) {
  var _getContextFns;

  var getContextFns = (_getContextFns = {}, _defineProperty(_getContextFns, STEPS.CREATE, getCreateContext), _defineProperty(_getContextFns, STEPS.AUTHORIZE, getAuthorizeContext), _defineProperty(_getContextFns, STEPS.CHECK, getCheckContext), _defineProperty(_getContextFns, STEPS.SELECT_FIELDS, getSelectFieldsContext), _getContextFns);
  var getContextFn = getContextFns[step];
  if (getContextFn) {
    return getContextFn(baseContext, options);
  }
  return context;
}

function upsertSourceIntegration(step, options) {
  var id = options.id,
      check_job_name = options.check_job_name,
      type = options.type,
      default_selections = options.default_streams,
      ephemeral_token = options.ephemeral_token;

  var baseContext = {
    version: 2,
    hideNav: true,
    preventIntegrationFormClose: true,
    additionalState: {
      default_selections,
      ephemeral_token
    }
  };
  var context = getContext(baseContext, step, options);

  return new Promise(function (resolve, reject) {
    var client = new _Client2.default();
    var integration = void 0;
    client.subscribe(function (event) {
      console.log("event", event);

      if (event.type === _EVENT_TYPES2.default.ERROR_LOADING_CONNECTION && event.data.id === id) {
        reject(new Error("Integration with id=" + id + " not found."));
        client.close();
      } else if (event.type === _EVENT_TYPES2.default.CLOSED || event.type === _EVENT_TYPES2.default.INTEGRATION_FORM_CLOSE) {
        if (integration) {
          resolve(integration);
        } else {
          reject(new Error("App closed without saving integration."));
        }
        client.close();
      } else if (event.type === _EVENT_TYPES2.default.CONNECTION_CREATED && type && event.data.type === type || event.type === _EVENT_TYPES2.default.CONNECTION_UPDATED && id && event.data.id === id) {
        integration = event.data;
      }
    });
    client.initialize(context);
  });
}

function addSource(options) {
  return upsertSourceIntegration(STEPS.CREATE, options);
}

function authorizeSource(options) {
  return upsertSourceIntegration(STEPS.AUTHORIZE, options);
}

function displayDiscoveryOutputForSource(options) {
  return upsertSourceIntegration(STEPS.CHECK, options);
}

function selectStreamsForSource(options) {
  return upsertSourceIntegration(STEPS.SELECT_FIELDS, options);
}

},{"./Client.js":1,"./EVENT_TYPES.js":2}]},{},[3])(3)
});
