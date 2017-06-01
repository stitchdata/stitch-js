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
window.Stitch.addIntegration("adroll", (result) => {
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

Stitch.addIntegration("adroll", (result) => {
  if (result) {
    console.log(`Integration created, type=${result.type}, id=${result.id}`);
  } else {
    console.log("Integration not created.");
  }
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
