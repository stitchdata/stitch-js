import EVENT_TYPES from "./EVENT_TYPES.js";

const HOST = process.env.STITCH_JS_HOST || "https://app.stitchdata.com"
const ROOT = `${HOST}/v2/js-client`;
const log = process.env.STITCH_JS_VERBOSE_OUTPUT === "true" ? console.log : function(){};

const KNOWN_MESSAGE_TYPES = new Set(Object.values(EVENT_TYPES));

export default class StitchClient {

  constructor(context={}) {
    this._childWindow = null;
    this._initialized = false;
    this._context = context;
    this._subscribers = [];
    window.addEventListener("message", (event) => {
      if (event.source === this._childWindow) {
        this._onMessage(event.data);
      }
    });
  }

  subscribe(callback) {
    const unlisten = () => { this._subscribers = this._subscribers.filter((_callback) => callback !== callback)}
    this._subscribers.push(callback);
    return unlisten;
  }

  _emit(event) {
    for (let subscriber of this._subscribers) {
      subscriber(event);
    }
  }

  _onMessage(event) {
    if (event.type === EVENT_TYPES.BOOTSTRAP) {
      log("event: initialized");
      this._initialized = true;
      this._sendContext();
    } else if (event.type === "closed") {
      log("event: closed")
      this._childWindow = null;
      this._initialized = false;
      this._emit(event);
    } else if (KNOWN_MESSAGE_TYPES.has(event.type)) {
      log("event", event);
      this._emit(event);
    } else {
      log("event: [WARNING] unknown message type", event);
    }
  }

  _sendContext() {
    if (!this._initialized || this._childWindow.closed) {
      return this.initialize();
    }
    log("send context", this._context);
    this._childWindow.postMessage({
      type: "update",
      data: this._context
    }, "*");
  }

  setContext(context) {
    this._content = context;
    this._sendContext();
  }

  initialize(context={}) {
    log("initialize");
    this._context = context;
    if (this._childWindow) {
      this._childWindow.close();
    }
    this._initialized = false;
    this._childWindow = window.open(ROOT);
  }

  close() {
    log("close");
    if (this._childWindow) {
      this._childWindow.close();
    }
  }
}
