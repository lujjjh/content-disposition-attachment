# content-disposition-attachment

[![npm](https://img.shields.io/npm/v/content-disposition-attachment)](https://www.npmjs.com/package/content-disposition-attachment)
![npm bundle size](https://img.shields.io/bundlephobia/min/content-disposition-attachment)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/lujjjh/content-disposition-attachment/ci.yml)

> A library to parse "attachment"s in Content-Disposition.

## Getting started

### Install via npm

```sh
npm install content-disposition-attachment
```

#### ESM

```js
import { parse } from 'content-disposition-attachment';

console.log(parse('attachment; filename=foo.html'));
// => { attachment: true, filename: 'foo.html' }
```

#### CommonJS

```js
const { parse } = require('content-disposition-attachment');

console.log(parse('attachment; filename=foo.html'));
// => { attachment: true, filename: 'foo.html' }
```

### Import from CDN

#### UMD

```html
<script src="https://unpkg.com/content-disposition-attachment@0.3"></script>
<script>
  console.log(ContentDispositionAttachment.parse('attachment; filename="foo.html"'));
  // => { attachment: true, filename: 'foo.html' }
</script>
```

#### ESM

```html
<script type="module">
  import { parse } from 'https://unpkg.com/content-disposition-attachment@0.3?module';

  console.log(parse('attachment; filename=foo.html'));
  // => { attachment: true, filename: 'foo.html' }
</script>
```

## API references

### parse

> Parse a Content-Disposition.

If Content-Disposition is not "attachment", it returns `{ attachment: false }`;
otherwise, it returns `{ attachment: true }` along with parsed parameters.

If errors occur when parsing parameters, a `ParseError` will be thrown.

**Examples**

```js
import { parse } from 'content-disposition-attachment';

parse('inline');
// => { attachment: false }

parse('attachment; filename=foo.html; foo=bar');
// => { attachment: true, filename: 'foo.html', foo: 'bar' }

parse('attachment; foo');
// => ParseError: expect '='
```

You can find more examples in the [unit tests](test/parse.js).
