# Stitch JS Client [beta]

JavaScript client for integrating with `app.stitchdata.com`.

Supported features:

- The ability to pop-up a window to allow the user to create an integration of a particular type.

## Installation

Reference `dist/stitch-client.min.js` from a script tag:

```html
<!-- local file -->
<script src="stitch-client.min.js"></script>
```

## Example usage

```javascript
window.Stitch.addSourceIntegration("adroll", (result) => {
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

Stitch.addSourceIntegration("adroll", (result) => {
  if (result) {
    console.log(`Integration created, type=${result.type}, id=${result.id}`);
  } else {
    console.log("Integration not created.");
  }
});
```

The first argument to `addSourceIntegration` is a string that represents the source type.  The following types have been tested with Stitch.js:

 - `platform.hubspot`
 - `platform.marketo`
 - `salesforce`
 - `zendesk`

This repository also includes a complete (but very basic) example application in the `example/` directory.

You can run `npm install` from the root directory of the repo to install `http-server`, and then start a server to run this

```shell
stitch-js-client$ npm install # you'll only have to do this once
stitch-js-client$ http-server
# The site should now be available at http://127.0.0.1:8080/example
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
