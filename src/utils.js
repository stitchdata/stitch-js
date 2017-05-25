import Client from "./Client.js";
import EVENT_TYPES from "./EVENT_TYPES.js";

export function addIntegration(type, callback) {
  const client = new Client();
  let newIntegration = null;
  client.subscribe((event) => {
    if (event.type === EVENT_TYPES.CONNECTION_CREATED && event.data.type === type)  {
      newIntegration = event.data;
    } else if (event.type === EVENT_TYPES.CLOSED || event.type === EVENT_TYPES.INTEGRATION_FORM_CLOSE) {
      client.close();
      callback(newIntegration);
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
