# Stitch JS Client

JavaScript client for integrating with `app.stitchdata.com`.

Supported features:

* The ability to pop-up a window to:
  * Allow the user to create a source of a particular type
  * Authorize an existing source
  * Run a connection check for an existing source
  * Select streams to replicate for an existing source

## Installation

Run `npm run build` to build the stitch-js app then reference `dist/stitch-client.umd.min.js` from a script tag:

```html
<!-- local file -->
<script src="stitch-client.umd.min.js"></script>
```

## Example usage

Here's an example of creating a new Adroll source:

```javascript
// If you're not using ES6 modules, you can remove this line (Stitch will be
// available as window.Stitch):
import * as Stitch from "stitch-client";

Stitch.addSource({ type: "adroll" })
  .then(result => {
    console.log(`Source created, type=${result.type}, id=${result.id}`);
  })
  .catch(error => {
    console.log("Source not created.", error);
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

Stitch.js officially supports the following source types:

* `platform.hubspot`
* `platform.marketo`
* `salesforce`
* `zendesk`

All of the public API functions expect an `options` object as the only argument, and return a `Promise`.

**Note:** Stitch uses a step-based flow for creating sources. The flow is:

1. Create (show a form and prompt for any required properties like schema name)
2. Authorize
3. Run connection check
4. Select streams

When you send a user to a particular step, the user will also be prompted to complete any successive steps. If, for example, you direct the user to the connection check step (step 3), and the source requires stream selection, the user will also be prompted to select streams.

### Options

Each API function expects specific `options` properties, but a couple of optional properties are supported by all API functions:

* `default_streams`: (optional) this property will be used to set default selections for the data structures to be replicated during the select streams setup. It should be an object of the form `{"table_name": true}`. **Note:** If a table name is given that is not produced by the source, it is ignored. Values other than `true` are also ignored, and nesting of default selections is not currently supported - only top level tables can be provided.

* `ephemeral_token`: (optional) this token can be used to automatically login the user.

Here's an example of adding a Hubspot source using an ephemeral token and default stream selections to pre-select the campaigns and companies tables:

```javascript
import * as Stitch from "stitch-client";

Stitch.addSource({
  type: "platform.hubspot",
  default_streams: { campaigns: true, companies: true },
  ephemeral_token: "some-ephemeral-token"
})
  .then(result => {
    console.log(`Source created, type=${result.type}, id=${result.id}`);
  })
  .catch(error => {
    console.log("Source not created.", error);
  });
```

### `addSource(options)`

Options:

* `type` (required)

(See example usage above.)

### `editSource(options)`

Options:

* `id` (required)

Example usage:

```javascript
import * as Stitch from "stitch-client";

Stitch.editSource({
  id: 123
})
  .then(result => {
    console.log(`Source updated, type=${result.type}, id=${result.id}`);
  })
  .catch(error => {
    console.log("Editing source failed.", error);
  });
```

### `authorizeSource(options)`

Options:

* `id` (required)

Example usage:

```javascript
import * as Stitch from "stitch-client";

Stitch.authorizeSource({
  id: 123
})
  .then(result => {
    console.log(`Source authorized, type=${result.type}, id=${result.id}`);
  })
  .catch(error => {
    console.log("Authorization failed.", error);
  });
```

### `displayDiscoveryOutputForSource(options)`

Options:

* `id` (required)
* `discovery_job_name` (required)

Example usage:

```javascript
import * as Stitch from "stitch-client";

Stitch.displayDiscoveryOutputForSource({
  id: 123,
  discovery_job_name: "987-123-4567891234-checks"
})
  .then(() => {
    console.log(`Discovery succeeded.`);
  })
  .catch(error => {
    console.log("Discovery failed.", error);
  });
```

### `selectStreamsForSource(options)`

Options:

* `id` (required)

Example usage:

```javascript
import * as Stitch from "stitch-client";

Stitch.selectStreamsForSource({
  id: 123
})
  .then(result => {
    console.log(`Streams selected, type=${result.type}, id=${result.id}`);
  })
  .catch(error => {
    console.log("Streams not selected.", error);
  });
```

### Errors

If the user doesn't complete any of the steps successfully, the promise will be rejected with an instance of one of these error classes:

* `AppClosedPrematurelyError`
* `SourceNotFoundError`
* `UnknownSourceTypeError`
* `UpgradeEphemeralTokenError`

## Building

Install dev dependencies by running (from the root of this repo):

```
npm install
```

To build `dist/` packages, run:

```
npm run build
```

You can also run `npm run watch` to start a process what builds packages whenever a source file changes.

To use a host other than `https://app.stitchdata.com`, set the `STITCH_JS_HOST` variable in your environment before building:

```
export STITCH_JS_HOST="http://stitch.localhost.dev:1234"
npm run build
```

You can also enable logging with `STITCH_JS_VERBOSE_OUTPUT=true`.
