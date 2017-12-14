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
  if (!options.check_job_name) {
    throw new Error("You must specify `options.check_job_name`");
  }
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

function upsertSourceIntegration(step, options, _callback) {
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
      ephimeral_token
    }
  };
  const context = getContext(baseContext, step, options);

  const client = new Client();
  let callbackInvoked = false;
  let integration;
  client.subscribe((event) => {
    console.log(event);
    if (event.type === EVENT_TYPES.CONNECTION_CREATED && event.data.type === type)  {
        integration = event.data;
        //CLOSED EVENTS should never get into this callback. see _onMessage in Client.js
    } else if (event.type === EVENT_TYPES.CLOSED || event.type === EVENT_TYPES.INTEGRATION_FORM_CLOSE) {
      client.close();
      if (!callbackInvoked) {
        callback(integration);
        callbackInvoked = true;
      }
    }
  });
  // client.subscribe((event) => {
  //   console.log(event);
  //   // if (event.type === EVENT_TYPES.CONNECTION_AUTHORIZED && event.data.connectionId === connectionId) {
  //   //   console.log("authorized successfully");
  //   //   callback(event.data);
  //   //   client.close();
  //   // } else if (event.type === EVENT_TYPES.ERROR_AUTHORIZING_CONNCTION && event.data.connectionId === connectionId) {
  //   //   console.log("error authorizing connection");
  //   //   callback();
  //   //   client.close();
  //   // } else if (event.type === EVENT_TYPES.ERROR_LOADING_CONNECTION && event.data.connectionId === connectionId) {
  //   //   console.log("error loading connection");
  //   //   callback();
  //   //   client.close();
  //   // } else
  //   if (event.type === EVENT_TYPES.CLOSED) {
  //     console.log("window closed");
  //     callback();
  //     client.close();
  //   }
  // });
  client.initialize(context);
}

export function addSourceIntegration(options, callback) {
  return upsertSourceIntegration(STEPS.CREATE, options, callback);
}

export function authorizeSourceIntegration(options, callback) {
  return upsertSourceIntegration(STEPS.AUTHORIZE, options, callback);
}

export function runCheckForSourceIntegration(options, callback) {
  return upsertSourceIntegration(STEPS.CHECK, options, callback);
}

export function selectFieldsForSourceIntegration(options, callback) {
  return upsertSourceIntegration(STEPS.SELECT_FIELDS, options, callback);
}
