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

```javascript
// Creating a new integration
window.Stitch.addSourceIntegration({type: "adroll"}, (result) => {
  if (result) {
    console.log(`Integration created, type=${result.type}, id=${result.id}`);
  } else {
    console.log("Integration not created.");
  }
});
```

Or, if you're using ES6 modules:

```javascript
import * as Stitch from "stitch-client";

Stitch.addSourceIntegration({type: "adroll"}, (result) => {
  if (result) {
    console.log(`Integration created, type=${result.type}, id=${result.id}`);
  } else {
    console.log("Integration not created.");
  }
});
```

This repository also includes a complete (but very basic)
example application in the `example/` directory.

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

All of the public API functions accept two arguments: an `options` object, and a `callback` function.

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
window.Stitch.addSourceIntegration({
  type: "platform.hubspot",
  default_selections: {"campaigns": true, "companies": true},
  ephemeral_token: "some-ephemeral-token"
}, (result) => {
  if (result) {
    console.log(`Integration created, type=${result.type}, id=${result.id}`);
  } else {
    console.log("Integration not created.");
  }
});
```

### `addSourceIntegration(options, callback)`

Options:

- `type` (required)

### `authorizeSourceIntegration(options, callback)`

Options:

- `id` (required)

### `runCheckForSourceIntegration(options, callback)`

Options:

- `id` (required)
- `check_job_name` (required)

### `selectFieldsForSourceIntegration(options, callback)`

Options:

- `id` (required)

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
