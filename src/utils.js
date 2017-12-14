import Client from "./Client.js";
import EVENT_TYPES from "./EVENT_TYPES.js";

export const STEPS = {
  CREATE: "CREATE",
  AUTHORIZE: "AUTHORIZE",
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
    [STEPS.AUTHORIZE]: getAuthorizeContext,
    [STEPS.DISCOVER]: getDiscoveryContext,
    [STEPS.SELECT_STREAMS]: getSelectStreamsContext
  };
  const getContextFn = getContextFns[step];
  if (getContextFn) {
    return getContextFn(baseContext, options);
  }
  return context;
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
    client.subscribe((event) => {

      if (event.type === EVENT_TYPES.ERROR_LOADING_CONNECTION && event.data.id === id) {
        reject(new Error(`Integration with id=${id} not found.`));
        client.close();
      } else if (event.type === EVENT_TYPES.CLOSED) {
        if (integration){
          resolve(integration);
        } else {
          reject(new Error(`App closed before reaching end of flow.`));
        }
        client.close();
      } else if (event.type === EVENT_TYPES.INTEGRATION_FORM_CLOSE) {
        resolve(integration);
        client.close();
      } else if (event.type === EVENT_TYPES.INTEGRATION_FLOW_COMPLETED &&
        ((type && event.data.type === type) || (id && event.data.id === id))
      ) {
        integration = event.data;
      }

    });
    client.initialize(context);
  });
}

export function addSource(options) {
  return upsertSourceIntegration(STEPS.CREATE, options);
}

export function authorizeSource(options) {
  return upsertSourceIntegration(STEPS.AUTHORIZE, options);
}

export function displayDiscoveryOutputForSource(options) {
  return upsertSourceIntegration(STEPS.DISCOVER, options);
}

export function selectStreamsForSource(options) {
  return upsertSourceIntegration(STEPS.SELECT_STREAMS, options);
}
