import Client from "./Client.js";
import EVENT_TYPES from "./EVENT_TYPES.js";
import Object from "core-js/library/fn/object";
import Promise from "core-js/library/fn/promise";

export const STEPS = {
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
  return Object.assign(baseContext, {
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
  return Object.assign(baseContext, {
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
  return Object.assign(baseContext, {
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
  return Object.assign(baseContext, {
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

export class SourceNotFoundError extends Error {
  constructor(id) {
    super(`Integration with id ${id} not found.`);
    this.constructor = SourceNotFoundError;
  }
}

export class UnknownSourceTypeError extends Error {
  constructor(type) {
    super(`Unknown source type: "${type}".`);
    this.constructor = UnknownSourceTypeError;
  }
}

export class AppClosedPrematurelyError extends Error {
  constructor() {
    super("App closed before reaching end of flow.");
    this.constructor = AppClosedPrematurelyError;
  }
}

export class UpgradeEphemeralTokenError extends Error {
  constructor() {
    super("Error upgrading ephemeral token.");
    this.constructor = UpgradeEphemeralTokenError;
  }
}

export class AuthorizeFailureError extends Error {
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
    const client = new Client();
    let integration;
    client.subscribe(event => {
      if (event.type === EVENT_TYPES.ERROR_LOADING_CONNECTION &&
          event.data.id === id) {
        reject(new SourceNotFoundError(id));
        client.close();
      } else if (event.type === EVENT_TYPES.ERROR_LOADING_INTEGRATION_TYPE &&
                 type &&
                 event.data.type === type) {
        reject(new UnknownSourceTypeError(type));
        client.close();
      } else if (event.type === EVENT_TYPES.ERROR_UPGRADING_EPHEMERAL_TOKEN) {
        reject(new UpgradeEphemeralTokenError());
        client.close();
      } else if (event.type === EVENT_TYPES.CLOSED ||
                 event.type === EVENT_TYPES.INTEGRATION_FORM_CLOSE) {
        if (integration) {
          resolve(integration);
        } else {
          reject(new AppClosedPrematurelyError());
        }
        client.close();
      } else if (event.type === EVENT_TYPES.INTEGRATION_FLOW_COMPLETED &&
                 ((type && event.data.type === type) || (id && event.data.id === id))) {
        integration = event.data;
      } else if (event.type == EVENT_TYPES.AUTHORIZE_SUCCESS &&
                 step == STEPS.ONLY_AUTHORIZE) {
        client.close();
      } else if (event.type == EVENT_TYPES.AUTHORIZE_FAILURE &&
                 step == STEPS.ONLY_AUTHORIZE) {
        reject(new AuthorizeFailureError());
        client.close();
      }
    });
    client.initialize(context);
  });
}

export function addSource(options) {
  return upsertSourceIntegration(STEPS.CREATE, options);
}

export function editSource(options) {
  return upsertSourceIntegration(STEPS.EDIT, options);
}

export function authorizeSource(options) {
  return upsertSourceIntegration(STEPS.AUTHORIZE, options);
}

export function onlyAuthorizeSource(options) {
  return upsertSourceIntegration(STEPS.ONLY_AUTHORIZE, options);
}

export function displayDiscoveryOutputForSource(options) {
  return upsertSourceIntegration(STEPS.DISCOVER, options);
}

export function selectStreamsForSource(options) {
  return upsertSourceIntegration(STEPS.SELECT_STREAMS, options);
}
