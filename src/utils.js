import Client from "./Client.js";
import EVENT_TYPES from "./EVENT_TYPES.js";

export function addSourceIntegration(type, callback) {
  const client = new Client();
  let callbackInvoked = false;
  client.subscribe((event) => {
    if (event.type === EVENT_TYPES.CONNECTION_CREATED && event.data.type === type)  {
      if (!callbackInvoked) {
        callback(event.data);
        callbackInvoked = true;
      }
    } else if (event.type === EVENT_TYPES.CLOSED || event.type === EVENT_TYPES.INTEGRATION_FORM_CLOSE) {
      client.close();
      if (!callbackInvoked) {
        callback();
        callbackInvoked = true;
      }
    }
  });
  client.initialize({
    hideNav: true,
    preventIntegrationFormClose: true,
    targetState: {
      name: "app.connections.create",
      params: {
        route: type
      }
    }
  });
}
