import Client from "./Client.js";
import EVENT_TYPES from "./EVENT_TYPES.js";

export function addSourceIntegration(type, callback, defaultSelections={}) {
  const client = new Client();
  let callbackInvoked = false;
  let integration;
  client.subscribe((event) => {
    if (event.type === EVENT_TYPES.CONNECTION_CREATED && event.data.type === type)  {
      integration = event.data;
    } else if (event.type === EVENT_TYPES.CLOSED || event.type === EVENT_TYPES.INTEGRATION_FORM_CLOSE) {
      client.close();
      if (!callbackInvoked) {
        callback(integration);
        callbackInvoked = true;
      }
    }
  });
  client.initialize({
    hideNav: true,
    preventIntegrationFormClose: true,
    defaultSelections: defaultSelections,
    targetState: {
      name: "app.connections.create",
      params: {
        route: type
      }
    }
  });
}
