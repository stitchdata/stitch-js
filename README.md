# Stitch JS Client [beta]

JavaScript client for integrating with `app.stitchdata.com`.

Supported features:

- The ability to pop-up a window to:
  - Allow the user to create an integration of a particular type
  - Authorize an existing integration
  - Run a connection check for an existing integration
  - Select tables to replicate for an existing integration

## Installation

Reference `dist/stitch-client.min.js` from a script tag:

```html
<!-- local file -->
<script src="stitch-client.min.js"></script>
```

## Example usage

Here's an example of creating a new Adroll integration:

```javascript
// Creating a new integration
// If you're not using ES6 modules, you can remove this line (Stitch will be
// available as window.Stitch):
import * as Stitch from "stitch-client";

Stitch.addSourceIntegration({type: "adroll"}).then((result) => {
  console.log(`Integration created, type=${result.type}, id=${result.id}`);
}).catch((error) => {
  console.log("Integration not created.", error);
});
```

This repository also includes an example application in the `example/` directory.

You can run `npm install` from the root directory of the repo to install `http-server`, and then start a server to run this

```shell
stitch-js-client$ npm install # you'll only have to do this once
stitch-js-client$ http-server
# The site should now be available at http://127.0.0.1:8080/example
```

## API

Stitch.js _officially_ supports the following integration types:

 - `platform.hubspot`
 - `platform.marketo`
 - `salesforce`
 - `zendesk`

All of the public API functions expect an `options` object as the only argument, and return a `Promise`.

**Note:** Stitch uses a step-based flow for creating integrations. The flow is:

1. Create (show a form and prompt for any required properties like schema name)
2. Authorize
3. Run connection check
4. Select fields

When you send a user to a particular step, the user will also be prompted to complete any successive steps. If, for example, you direct the user to the connection check step (step 3), and the integration requires field selection, the user will also be prompted to select fields.

### Options

Each API function expects specific `options` properties, but a couple of optional properties are supported by all API functions:

- `default_selections`: (optional) this property will be used to set default selections for the data structures to be replicated during the source integration setup. It should be an object of the form `{"table_name": true}`. **Note:** If a table name is given that is not produced by the source
integration, it is ignored. Values other than `true` are also ignored, and
nesting of default selections is not currently supported - only top level
tables can be provided.

- `ephemeral_token`: (optional) this token can be used to automatically login the user.

Here's an example of adding a Hubspot integration using an ephemeral token and default field selections to pre-select the campaigns and companies tables:

```javascript
import * as Stitch from "stitch-client";

Stitch.addSourceIntegration({
  type: "platform.hubspot",
  default_selections: {"campaigns": true, "companies": true},
  ephemeral_token: "some-ephemeral-token"
}).then((result) => {
  console.log(`Integration created, type=${result.type}, id=${result.id}`);
}).catch((error) => {
  console.log("Integration not created.", error);
});
```

### `addSourceIntegration(options)`

Options:

- `type` (required)

(See example usage above.)

### `authorizeSourceIntegration(options)`

Options:

- `id` (required)

Example usage:

```javascript
import * as Stitch from "stitch-client";

Stitch.addSourceIntegration({
  id: 123
}).then((result) => {
  console.log(`Integration created, type=${result.type}, id=${result.id}`);
}).catch((error) => {
  console.log("Integration not created.", error);
});
```

### `runCheckForSourceIntegration(options)`

Options:

- `id` (required)
- `check_job_name` (required)

Example usage:

```javascript
import * as Stitch from "stitch-client";

Stitch.runCheckForSourceIntegration({
  id: 123,
  check_job_name: "987-123-4567891234-checks"
}).then((result) => {
  console.log(`Integration created, type=${result.type}, id=${result.id}`);
}).catch((error) => {
  console.log("Integration not created.", error);
});
```

### `selectFieldsForSourceIntegration(options)`

Options:

- `id` (required)

Example usage:

```javascript
import * as Stitch from "stitch-client";

Stitch.selectFieldsForSourceIntegration({
  id: 123
}).then((result) => {
  console.log(`Integration created, type=${result.type}, id=${result.id}`);
}).catch((error) => {
  console.log("Integration not created.", error);
});
```

## Building

Install dev dependencies by running (from the root of this repo):

```
npm install
```

To build `dist/stitch-client.js` and `dist/stitch-client.min.js`, run:

```
npm run build && npm run minify
```

To use a host other than `https://app.stitchdata.com`, set the `STITCH_JS_HOST` variable in your environment before building:

```
export STITCH_JS_HOST="http://stitch.localhost.dev:1234"
npm run build
```

You can also enable logging with `STITCH_JS_VERBOSE_OUTPUT=true`.
