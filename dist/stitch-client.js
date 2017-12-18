import Object$1 from 'core-js/library/fn/object';
import Promise from 'core-js/library/fn/promise';

var EVENT_TYPES = Object.freeze({
  BOOTSTRAP: "bootstrap",
  CLOSED: "closed",
  CONNECTION_CREATED: "connectionCreated",
  CONNECTION_UPDATED: "connectionUpdated",
  ERROR_AUTHORIZING_CONNCTION: "errorAuthorizingConnection",
  ERROR_LOADING_CONNECTION: "errorLoadingConnection",
  ERROR_LOADING_INTEGRATION_TYPE: "errorLoadingIntegrationType",
  ERROR_UPGRADING_EPHEMERAL_TOKEN: "errorUpgradingEphemeralToken",
  INTEGRATION_FLOW_COMPLETED: "integrationFlowCompleted",
  INTEGRATION_FORM_CLOSE: "integrationFormClose"
});

const HOST = "http://app.stitchdata.test:8080";
const ROOT = `${HOST}/v2/js-client`;
const log =
  undefined === true ? console.log : function() {};

const KNOWN_MESSAGE_TYPES = Object$1.values(EVENT_TYPES);

class StitchClient {
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
    if (event.type === EVENT_TYPES.BOOTSTRAP) {
      log("event: initialized");
      this._initialized = true;
      this._sendContext();
    } else if (event.type === EVENT_TYPES.CLOSED) {
      this._windowClosed();
    } else if (KNOWN_MESSAGE_TYPES.indexOf(event.type) >= 0) {
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

const STEPS = {
  CREATE: "CREATE",
  AUTHORIZE: "AUTHORIZE",
  DISCOVER: "DISCOVER",
  SELECT_STREAMS: "SELECT_STREAMS"
};

function getCreateContext(baseContext, options) {
  if (!options.type) {
    throw new Error("You must specify `options.type`");
  }
  return Object$1.assign(baseContext, {
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
  return Object$1.assign(baseContext, {
    targetState: {
      name: "app.connections.details.authorize",
      params: {
        id: options.id
      }
    }
  });
}

function getDiscoveryContext(baseContext, options) {
  assertOptionsId(options);
  if (!options.discovery_job_name) {
    throw new Error("You must specify `options.discovery_job_name`");
  }
  return Object$1.assign(baseContext, {
    targetState: {
      name: "app.connections.details.check",
      params: {
        id: options.id,
        check_job_name: options.discovery_job_name
      }
    }
  });
}

function getSelectStreamsContext(baseContext, options) {
  assertOptionsId(options);
  return Object$1.assign(baseContext, {
    targetState: {
      name: "app.connections.details.fields",
      params: {
        id: options.id
      }
    }
  });
}

function getContext(baseContext, step, options) {
  const getContextFns = {
    [STEPS.CREATE]: getCreateContext,
    [STEPS.AUTHORIZE]: getAuthorizeContext,
    [STEPS.DISCOVER]: getDiscoveryContext,
    [STEPS.SELECT_STREAMS]: getSelectStreamsContext
  };
  const getContextFn = getContextFns[step];
  if (getContextFn) {
    return getContextFn(baseContext, options);
  }
  return baseContext;
}

class SourceNotFoundError extends Error {
  constructor(id) {
    super(`Integration with id ${id} not found.`);
    this.constructor = SourceNotFoundError;
  }
}
class UnknownSourceTypeError extends Error {
  constructor(type) {
    super(`Unknown source type: "${type}".`);
    this.constructor = UnknownSourceTypeError;
  }
}
class AppClosedPrematurelyError extends Error {
  constructor() {
    super("App closed before reaching end of flow.");
    this.constructor = AppClosedPrematurelyError;
  }
}
class UpgradeEphemeralTokenError extends Error {
  constructor() {
    super("Error upgrading ephemeral token.");
    this.constructor = UpgradeEphemeralTokenError;
  }
}

function upsertSourceIntegration(step, options) {
  let {
    id,
    type,
    default_streams: default_selections,
    ephemeral_token
  } = options;
  const baseContext = {
    version: 2,
    hideNav: true,
    preventIntegrationFormClose: true,
    additionalState: {
      default_selections,
      ephemeral_token
    }
  };
  const context = getContext(baseContext, step, options);

  return new Promise((resolve, reject) => {
    const client = new StitchClient();
    let integration;
    client.subscribe(event => {
      if (
        event.type === EVENT_TYPES.ERROR_LOADING_CONNECTION &&
        event.data.id === id
      ) {
        reject(new SourceNotFoundError(id));
        client.close();
      } else if (
        event.type === EVENT_TYPES.ERROR_LOADING_INTEGRATION_TYPE &&
        type &&
        event.data.type === type
      ) {
        reject(new UnknownSourceTypeError(type));
        client.close();
      } else if (event.type === EVENT_TYPES.ERROR_UPGRADING_EPHEMERAL_TOKEN) {
        reject(new UpgradeEphemeralTokenError());
        client.close();
      } else if (
        event.type === EVENT_TYPES.CLOSED ||
        event.type === EVENT_TYPES.INTEGRATION_FORM_CLOSE
      ) {
        if (integration) {
          resolve(integration);
        } else {
          reject(new AppClosedPrematurelyError());
        }
        client.close();
      } else if (
        event.type === EVENT_TYPES.INTEGRATION_FLOW_COMPLETED &&
        ((type && event.data.type === type) || (id && event.data.id === id))
      ) {
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
  return upsertSourceIntegration(STEPS.DISCOVER, options);
}

function selectStreamsForSource(options) {
  return upsertSourceIntegration(STEPS.SELECT_STREAMS, options);
}

export { STEPS, SourceNotFoundError, UnknownSourceTypeError, AppClosedPrematurelyError, UpgradeEphemeralTokenError, addSource, authorizeSource, displayDiscoveryOutputForSource, selectStreamsForSource };
