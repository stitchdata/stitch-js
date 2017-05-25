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

var HOST = "http://pipeline.localhost.dev:5000" || "https://app.stitchdata.com";
var ROOT = HOST + "/v2/js-client";
var log = undefined === "true" ? console.log : function () {};

var KNOWN_MESSAGE_TYPES = new Set(Object.values(_EVENT_TYPES2.default));

var StitchClient = function () {
  function StitchClient() {
    var _this = this;

    var context = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, StitchClient);

    this.childWindow = null;
    this.initialized = false;
    this._context = context;
    this.subscribers = [];
    window.addEventListener("message", function (event) {
      if (event.source === _this.childWindow) {
        _this.onMessage(event.data);
      }
    });
  }

  _createClass(StitchClient, [{
    key: "subscribe",
    value: function subscribe(callback) {
      var _this2 = this;

      var unlisten = function unlisten() {
        _this2.subscribers = _this2.subscribers.filter(function (_callback) {
          return callback !== callback;
        });
      };
      this.subscribers.push(callback);
      return unlisten;
    }
  }, {
    key: "_emit",
    value: function _emit(event) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.subscribers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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
  }, {
    key: "onMessage",
    value: function onMessage(event) {
      if (event.type === _EVENT_TYPES2.default.BOOTSTRAP) {
        log("event: initialized");
        this.initialized = true;
        this._sendContext();
      } else if (event.type === "closed") {
        log("event: closed");
        this.childWindow = null;
        this.initialized = false;
        this._emit(event);
      } else if (KNOWN_MESSAGE_TYPES.has(event.type)) {
        log("event", event);
        this._emit(event);
      } else {
        log("event: [WARNING] unknown message type", event);
      }
    }
  }, {
    key: "_sendContext",
    value: function _sendContext() {
      if (!this.initialized || this.childWindow.closed) {
        return this.initialize();
      }
      log("send context", this._context);
      this.childWindow.postMessage({
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
      if (this.childWindow) {
        this.childWindow.close();
      }
      this.initialized = false;
      this.childWindow = window.open(ROOT);
    }
  }, {
    key: "close",
    value: function close() {
      log("close");
      if (this.childWindow) {
        this.childWindow.close();
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
  CONNECTION_CREATED: "connectionCreated",
  CONNECTION_UPDATED: "connectionUpdated",
  INTEGRATION_FORM_CLOSE: "integrationFormClose"
});

},{}],3:[function(require,module,exports){
"use strict";

var Client = require("./Client.js");
var utils = require("./utils.js");

module.exports = {
  Client: Client,
  addIntegration: utils.addIntegration
};

},{"./Client.js":1,"./utils.js":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addIntegration = addIntegration;

var _Client = require("./Client.js");

var _Client2 = _interopRequireDefault(_Client);

var _EVENT_TYPES = require("./EVENT_TYPES.js");

var _EVENT_TYPES2 = _interopRequireDefault(_EVENT_TYPES);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addIntegration(type, callback) {
  var client = new _Client2.default();
  var newIntegration = null;
  client.subscribe(function (event) {
    if (event.type === _EVENT_TYPES2.default.CONNECTION_CREATED && event.data.type === type) {
      newIntegration = event.data;
    } else if (event.type === _EVENT_TYPES2.default.CLOSED || event.type === _EVENT_TYPES2.default.INTEGRATION_FORM_CLOSE) {
      client.close();
      callback(newIntegration);
    }
  });
  client.initialize({
    showChrome: false,
    targetState: {
      name: "app.connections.create",
      params: {
        route: type
      }
    }
  });
}

},{"./Client.js":1,"./EVENT_TYPES.js":2}]},{},[3])(3)
});