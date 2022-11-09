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

If errors occur when parsing parameters, a `ParseError` will be thrown.

**Examples**

```js
import { parse } from 'content-disposition-attachment';

parse('inline')
// => { attachment: false }

parse('attachment; filename=foo.html; foo=bar')
// => { attachment: true, filename: 'foo.html', foo: 'bar' }

parse('attachment; foo')
// => ParseError: expect '='
```

You can find more examples in the [examples directory](examples/) and the [unit tests](test/).
