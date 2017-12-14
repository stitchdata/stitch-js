import Client from "./Client.js";
import EVENT_TYPES from "./EVENT_TYPES.js";

export const STEPS = {
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
  const getContextFns = {
    [STEPS.CREATE]: getCreateContext,
    [STEPS.AUTHORIZE]: getAuthorizeContext,
    [STEPS.CHECK]: getCheckContext,
    [STEPS.SELECT_FIELDS]: getSelectFieldsContext
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
    check_job_name,
    type,
    default_selections,
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
      console.log("event", event);

      if (event.type === EVENT_TYPES.ERROR_LOADING_CONNECTION && event.data.id === id) {
        reject(new Error(`Integration with id=${id} not found.`));
        client.close();
      } else if (event.type === EVENT_TYPES.CLOSED || event.type === EVENT_TYPES.INTEGRATION_FORM_CLOSE) {
        if (integration) {
          resolve(integration);
        } else {
          reject(new Error(`App closed without saving integration.`));
        }
        client.close();
      } else if ((event.type === EVENT_TYPES.CONNECTION_CREATED && type && event.data.type === type) ||
        (event.type === EVENT_TYPES.CONNECTION_UPDATED && id && event.data.id === id))
      {
        integration = event.data;
      }

    });
    client.initialize(context);
  });
}

export function addSourceIntegration(options) {
  return upsertSourceIntegration(STEPS.CREATE, options);
}

export function authorizeSourceIntegration(options) {
  return upsertSourceIntegration(STEPS.AUTHORIZE, options);
}

export function runCheckForSourceIntegration(options) {
  return upsertSourceIntegration(STEPS.CHECK, options);
}

export function selectFieldsForSourceIntegration(options) {
  return upsertSourceIntegration(STEPS.SELECT_FIELDS, options);
}
