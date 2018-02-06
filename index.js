class ParseError extends Error {
  constructor (message) {
    super(message)
    Error.captureStackTrace(this, ParseError)
  }
}

class Parser {
  constructor (code) {
    this.code = code
  }

  expect (value, message) {
    if (!value) {
      throw new ParseError(message)
    }
    return value
  }

  eat (pattern) {
    const match = pattern.exec(this.chunk)
    if (!match) {
      return []
    }
    this.chunk = this.chunk.slice(match[0].length)
    return match
  }

  eat$0 (pattern) {
    return this.eat(pattern)[0]
  }

  eatSpaces () {
    return this.eat$0(/^\s*/)
  }

  // CHAR           = <any US-ASCII character (octets 0 - 127)>
  // CTL            = <any US-ASCII control character
  //                  (octets 0 - 31) and DEL (127)>
  // token          = 1*<any CHAR except CTLs or separators>
  // separators     = "(" | ")" | "<" | ">" | "@"
  //                | "," | ";" | ":" | "\" | <">
  //                | "/" | "[" | "]" | "?" | "="
  //                | "{" | "}" | SP | HT
  parseToken () {
    return this.eat$0(/^[!#$%&'*+\-.\w^`|~]+/)
  }

  // quoted-string  = ( <"> *(qdtext | quoted-pair ) <"> )
  // qdtext         = <any TEXT except <">>
  // quoted-pair    = "\" CHAR
  // TEXT           = <any OCTET except CTLs,
  //                  but including LWS>
  // OCTET          = <any 8-bit sequence of data>
  // CRLF           = CR LF
  // LWS            = [CRLF] 1*( SP | HT )
  parseQuotedString () {
    if (!this.eat$0(/^"/)) {
      return
    }
    const result = this.eat$0(/^(:?([ !\x23-\x5b\x5d-\x7e\x80-\xff]|\r\n(?:[ \t])+)*|\\[\u0000-\u007f])*/)
    this.expect(this.eat$0(/^"/), `expect '"'`)
    return result.replace(/\\([\u0000-\u007f])/g, '$1')
  }

  // value          = token | quoted-string
  parseValue () {
    return this.parseToken() || this.parseQuotedString()
  }

  // handle attachment only
  parseAttachment () {
    return this.eat$0(/^attachment/i)
  }

  // disposition-parm    = filename-parm | disp-ext-parm
  //
  // filename-parm       = "filename" "=" value
  //                     | "filename*" "=" ext-value
  //
  // disp-ext-parm       = token "=" value
  //                     | ext-token "=" ext-value
  parseParm () {
    const key = this.expect(this.parseToken(), 'expect token')
    const ext = !!this.eat$0(/^\*/)
    this.expect(this.eat$0(/^\s*=\s*/), `expect '='`)
    const value = ext
      ? this.expect(this.parseExtValue(), 'expect ext-value')
      : this.expect(this.parseValue(), 'expect value')
    return { key, value }
  }

  // content-disposition = "Content-Disposition" ":"
  //                        disposition-type *( ";" disposition-parm )
  parse () {
    this.chunk = String(this.code)
    if (!this.parseAttachment()) {
      return { attachment: false }
    }
    const result = { attachment: true }
    this.eatSpaces()
    while (this.eat$0(/^;/)) {
      this.eatSpaces()
      let { key, value } = this.parseParm()
      if (/^filename$/i.test(key)) {
        key = 'filename'
      }
      if (key in result) {
        throw new ParseError(`duplicated field '${key}'`)
      }
      result[key] = value
    }
    if (this.chunk.length) {
      throw new ParseError('expect EOF')
    }
    return result
  }
}

exports.ParseError = ParseError

exports.parse = function (code) {
  return new Parser(code).parse()
}
