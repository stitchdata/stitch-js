import EVENT_TYPES from "./EVENT_TYPES.js";
import Object from "core-js/library/fn/object";

const HOST = process.env.STITCH_JS_HOST;
const ROOT = `${HOST}/v2/js-client`;
const log =
  process.env.STITCH_JS_VERBOSE_OUTPUT === true ? console.log : function() {};

const KNOWN_MESSAGE_TYPES = Object.values(EVENT_TYPES);

export default class StitchClient {
  constructor(context = {}) {
    this._childWindow = null;
    this._initialized = false;
    this._context = context;
    this._subscribers = [];
    window.addEventListener("message", event => {
      if (event.source === this._childWindow) {
        this._onMessage(event.data);
      }
    });
  }

  subscribe(callback) {
    const unlisten = () => {
      this._subscribers = this._subscribers.filter(
        _callback => callback !== callback
      );
    };
    this._subscribers.push(callback);
    return unlisten;
  }

  _emit(event) {
    for (let subscriber of this._subscribers) {
      subscriber(event);
    }
  }

  // The child window sends an event when closed, but if the window is closed
  // from outside the Stitch app (during the OAuth flow, for example), this
  // event won't be sent. So, check the window status every second.
  _pollForChildWindowClosed() {
    window.setTimeout(() => {
      if (this._childWindow) {
        if (this._childWindow.closed) {
          this._windowClosed();
        } else {
          this._pollForChildWindowClosed();
        }
      }
    }, 1000);
  }

  _windowClosed() {
    log("event: closed");
    this._childWindow = null;
    this._initialized = false;
    this._emit({ type: "closed" });
  }

  _onMessage(event) {
    log("event", event);
    if (event.type === EVENT_TYPES.BOOTSTRAP) {
      this._initialized = true;
      this._sendContext();
      log("initialized");
    } else if (event.type === EVENT_TYPES.CLOSED) {
    } else if (KNOWN_MESSAGE_TYPES.indexOf(event.type) >= 0) {
      this._emit(event);
    } else {
      log("[WARNING] unknown message type", event);
    }
  }

  _sendContext() {
    if (!this._initialized || this._childWindow.closed) {
      return this.initialize();
    }
    log("send context", this._context);
    this._childWindow.postMessage(
      {
        type: "update",
        data: this._context
      },
      "*"
    );
  }

  setContext(context) {
    this._content = context;
    this._sendContext();
  }

  initialize(context = {}) {
    log("initialize");
    this._context = context;
    if (this._childWindow) {
      this._childWindow.close();
    }
    this._initialized = false;
    this._childWindow = window.open(ROOT);
    this._pollForChildWindowClosed();
  }

  close() {
    log("close");
    if (this._childWindow) {
      this._childWindow.close();
    }
  }
}
