import Client from "./Client.js";
import EVENT_TYPES from "./EVENT_TYPES.js";

export function addSourceIntegration(type, callback) {
  const client = new Client();
  const unlisten = client.subscribe((event) => {
    if (event.type === EVENT_TYPES.CONNECTION_CREATED && event.data.type === type)  {
      unlisten();
      callback(event.data);
    } else if (event.type === EVENT_TYPES.CLOSED || event.type === EVENT_TYPES.INTEGRATION_FORM_CLOSE) {
      client.close();
      callback();
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
