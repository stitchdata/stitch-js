import Object$1 from 'core-js/library/fn/object';
import Promise from 'core-js/library/fn/promise';

var EVENT_TYPES = Object.freeze({
  BOOTSTRAP: "bootstrap",
  CLOSED: "closed",
  CONNECTION_CREATED: "connectionCreated",
  CONNECTION_UPDATED: "connectionUpdated",
  ERROR_LOADING_CONNECTION: "errorLoadingConnection",
  ERROR_LOADING_INTEGRATION_TYPE: "errorLoadingIntegrationType",
  ERROR_UPGRADING_EPHEMERAL_TOKEN: "errorUpgradingEphemeralToken",
  INTEGRATION_FLOW_COMPLETED: "integrationFlowCompleted",
  INTEGRATION_FORM_CLOSE: "integrationFormClose",
  AUTHORIZE_SUCCESS: "authorizeSuccess",
  AUTHORIZE_FAILURE: "authorizeFailure"
});

const HOST = "https://app.stitchdata.com";
const ROOT = `${HOST}/v2/js-client`;
const log =
  function() {};

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
    this._childWindow = null;
    this._initialized = false;
    this._emit({ type: "closed" });
  }

  _onMessage(event) {
    if (event.type === EVENT_TYPES.BOOTSTRAP) {
      this._initialized = true;
      this._sendContext();
    } else if (event.type === EVENT_TYPES.CLOSED) ; else if (KNOWN_MESSAGE_TYPES.indexOf(event.type) >= 0) {
      this._emit(event);
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
    this._context = context;
    if (this._childWindow) {
      this._childWindow.close();
    }
    this._initialized = false;
    this._childWindow = window.open(ROOT);
    this._pollForChildWindowClosed();
  }

  close() {
    if (this._childWindow) {
      this._childWindow.close();
    }
  }
}

const STEPS = {
  CREATE: "CREATE",
  EDIT: "EDIT",
  AUTHORIZE: "AUTHORIZE",
  ONLY_AUTHORIZE: "ONLY_AUTHORIZE",
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

function getEditContext(baseContext, options) {
  assertOptionsId(options);
  return Object$1.assign(baseContext, {
    targetState: {
      name: "app.connections.details.edit",
      params: {
        id: options.id
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
    [STEPS.EDIT]: getEditContext,
    [STEPS.AUTHORIZE]: getAuthorizeContext,
    [STEPS.ONLY_AUTHORIZE]: getAuthorizeContext,
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

class AuthorizeFailureError extends Error {
  constructor() {
    super("Error authorizing connection.");
    this.constructor = AuthorizeFailureError;
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

    // IN PROGRESS means we're continuing to the next step
    // SUCCESS means we've completed what we need to and can resolve with the id of the connection
    // FAILURE means we've failed and need to reject with an error
    let status = "IN_PROGRESS";
    let integration;
    let error;

    client.subscribe(event => {
      switch(event.type) {

      // This event kicks off whenever the tab is closed. Since we
      // close the tab on terminal states, this happens both through
      // normal interactions and user-generated interruptions
      // and. This is the final event that kicks off after being
      // done, as such, all resolution of the promise happens here
      // based on the status value.
      case EVENT_TYPES.CLOSED:
        if (status === "FAILED") {
          reject(error);
        } else if (status === "SUCCESS") {
          resolve(integration);
        } else {
          reject(new AppClosedPrematurelyError());
        }
        break;

      // All errors are terminal states. These should set the
      // exception to be returned in the promise and status should be
      // set to FAILED. Finally, the client.close() method should be
      // called. This triggers the CLOSED event and the promise is
      // rejected.
      case EVENT_TYPES.INTEGRATION_FORM_CLOSE:
        status = "FAILED";
        error = new AppClosedPrematurelyError();
        client.close();
        break;

      case EVENT_TYPES.ERROR_LOADING_CONNECTION:
        status = "FAILED";
        error = new SourceNotFoundError(event.data.id);
        client.close();
        break;

      case EVENT_TYPES.ERROR_LOADING_INTEGRATION_TYPE:
        status = "FAILED";
        error = new UnknownSourceTypeError(type);
        client.close();
        break;

      case EVENT_TYPES.ERROR_UPGRADING_EPHEMERAL_TOKEN:
        status = "FAILED";
        error = new UpgradeEphemeralTokenError();
        client.close();
        break;

      case EVENT_TYPES.AUTHORIZE_FAILURE:
        status = "FAILED";
        error = new AuthorizeFailureError();
        client.close();
        break;

      // There are two SUCCESS terminal states. When doing an
      // AUTH_ONLY flow, the AUTH_SUCCESS is terminal. For the other
      // flows, the FLOW_COMPLETED event signifies the terminal
      // state. Set the integration value to the event.data sent back
      // and call client.close() to resolve the promise with the
      // CLOSED event.
      case EVENT_TYPES.AUTHORIZE_SUCCESS:
        if (step === STEPS.ONLY_AUTHORIZE) {
          status = "SUCCESS";
          integration = event.data;
          client.close();
        }
        break;

      case EVENT_TYPES.INTEGRATION_FLOW_COMPLETED:
        status = "SUCCESS";
        integration = event.data;
        client.close();
        break;

      // Unhandled event types are not important, but we do send back
      // more events than this client cares about.
      default:
        break;
      }
    });

    client.initialize(context);
  });
}

function addSource(options) {
  return upsertSourceIntegration(STEPS.CREATE, options);
}

function editSource(options) {
  return upsertSourceIntegration(STEPS.EDIT, options);
}

function authorizeSource(options) {
  return upsertSourceIntegration(STEPS.AUTHORIZE, options);
}

function onlyAuthorizeSource(options) {
  return upsertSourceIntegration(STEPS.ONLY_AUTHORIZE, options);
}

function displayDiscoveryOutputForSource(options) {
  return upsertSourceIntegration(STEPS.DISCOVER, options);
}

function selectStreamsForSource(options) {
  return upsertSourceIntegration(STEPS.SELECT_STREAMS, options);
}

export { STEPS, SourceNotFoundError, UnknownSourceTypeError, AppClosedPrematurelyError, UpgradeEphemeralTokenError, AuthorizeFailureError, addSource, editSource, authorizeSource, onlyAuthorizeSource, displayDiscoveryOutputForSource, selectStreamsForSource };
