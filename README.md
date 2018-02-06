# content-disposition-attachment

[![Build Status](https://img.shields.io/travis/lujjjh/content-disposition-attachment/master.svg?style=flat-square)](https://travis-ci.org/lujjjh/content-disposition-attachment)

> A library to parse "attachment"s in Content-Disposition.

## Installation

```sh
npm install content-disposition-attachment
```

## Getting Started

### parse

> Parse a Content-Disposition.

If Content-Disposition is not "attachment", it returns `{ attachment: false }`;
otherwise, it returns `{ attachment: true }` along with parsed parameters.

If errors occur when parsing parameters, an `ParseError` will be thrown.

**Examples**

```js
const ContentDispositionAttachment = require('content-disposition-attachment')

ContentDispositionAttachment.parse('inline')
// => { attachment: false }

ContentDispositionAttachment.parse('attachment; filename=foo.html; foo=bar')
// => { attachment: true, filename: 'foo.html', foo: 'bar' }

ContentDispositionAttachment.parse('attachment; foo')
// => ContentDispositionAttachment.ParseError: expect '='
```
