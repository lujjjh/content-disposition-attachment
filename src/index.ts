export class ParseError extends Error {
  constructor(message: string) {
    super(message);

    if ('captureStackTrace' in Error) {
      (Error as unknown as any).captureStackTrace(this, ParseError);
    }

    // TODO: breaking change
    // this.name = 'ParseError';
  }
}

export type ParseResult =
  | { attachment: false }
  | ({
      attachment: true;
      filename?: string;
    } & Partial<Record<string, string>>);

class Parser {
  private chunk = '';

  constructor(private code: string) {}

  expect<T>(value: T, message: string) {
    if (!value) {
      throw new ParseError(message);
    }
    return value;
  }

  eat(pattern: RegExp) {
    const match = pattern.exec(this.chunk);
    if (!match) {
      return [];
    }
    this.chunk = this.chunk.slice(match[0].length);
    return match;
  }

  eat$0(pattern: RegExp) {
    return this.eat(pattern)[0];
  }

  eatSpaces() {
    return this.eat$0(/^\s*/);
  }

  // handle attachment only
  parseAttachment() {
    return this.eat$0(/^attachment/i);
  }

  // CHAR           = <any US-ASCII character (octets 0 - 127)>
  // CTL            = <any US-ASCII control character
  //                  (octets 0 - 31) and DEL (127)>
  // token          = 1*<any CHAR except CTLs or separators>
  // separators     = "(" | ")" | "<" | ">" | "@"
  //                | "," | ";" | ":" | "\" | <">
  //                | "/" | "[" | "]" | "?" | "="
  //                | "{" | "}" | SP | HT
  parseToken() {
    return this.eat$0(/^[!#$%&'*+\-.\w^`|~]+/);
  }

  // quoted-string  = ( <"> *(qdtext | quoted-pair ) <"> )
  // qdtext         = <any TEXT except <">>
  // quoted-pair    = "\" CHAR
  // TEXT           = <any OCTET except CTLs,
  //                  but including LWS>
  // OCTET          = <any 8-bit sequence of data>
  // CRLF           = CR LF
  // LWS            = [CRLF] 1*( SP | HT )
  parseQuotedString() {
    if (!this.eat$0(/^"/)) {
      return;
    }
    // eslint-disable-next-line
    const result = this.eat$0(/^(:?([ !\x23-\x5b\x5d-\x7e\x80-\xff]|\r\n(?:[ \t])+)*|\\[\u0000-\u007f])*/);
    this.expect(this.eat$0(/^"/), "expect '\"'");
    // eslint-disable-next-line
    return result.replace(/\\([\u0000-\u007f])/g, '$1');
  }

  // value          = token | quoted-string
  parseValue() {
    return this.parseToken() || this.parseQuotedString();
  }

  // value-chars   = *( pct-encoded / attr-char )
  //
  // pct-encoded   = "%" HEXDIG HEXDIG
  //               ; see [RFC3986], Section 2.1
  //
  // attr-char     = ALPHA / DIGIT
  //               / "!" / "#" / "$" / "&" / "+" / "-" / "."
  //               / "^" / "_" / "`" / "|" / "~"
  //               ; token except ( "*" / "'" / "%" )
  parseValueChars(charset: string) {
    let value = this.expect(this.eat$0(/^(?:%[0-9a-fA-F]{2}|[\w!#$&+\-.^`|~])*/), 'expect value-chars');
    switch (charset.toLowerCase()) {
      case 'utf-8':
        try {
          value = decodeURIComponent(value);
        } catch (error) {
          this.expect(false, 'invalid utf-8 string');
        }
        break;
      case 'iso-8859-1':
        value = value.replace(/%([0-9a-fA-F]{2})/g, ($0, hex) => String.fromCharCode(parseInt(hex, 16)));
        this.expect(!/[^\x20-\x7e\xa0-\xff]/.test(value), 'invalid iso-8859-1 string');
        break;
    }
    return value;
  }

  // ext-value     = charset  "'" [ language ] "'" value-chars
  //               ; like RFC 2231's <extended-initial-value>
  //               ; (see [RFC2231], Section 7)
  //
  // charset       = "UTF-8" / "ISO-8859-1" / mime-charset
  // language      = 2*3ALPHA            ; shortest ISO 639 code
  //                 ["-" extlang]       ; sometimes followed by
  //                                     ; extended language subtags
  //               / 4ALPHA              ; or reserved for future use
  //               / 5*8ALPHA            ; or registered language subtag
  parseExtValue() {
    const charset = this.expect(this.eat$0(/^(?:UTF-8|ISO-8859-1)/i), 'unsupported charset');
    this.expect(this.eat$0(/^'[a-zA-Z-]*'/), "expect ' [ language ] '");
    return this.parseValueChars(charset);
  }

  // disposition-parm    = filename-parm | disp-ext-parm
  //
  // filename-parm       = "filename" "=" value
  //                     | "filename*" "=" ext-value
  //
  // disp-ext-parm       = token "=" value
  //                     | ext-token "=" ext-value
  parseParm() {
    const key = this.expect(this.parseToken(), 'expect token');
    this.expect(this.eat$0(/^\s*=\s*/), "expect '='");
    const value = /\*$/.test(key)
      ? this.expect(this.parseExtValue(), 'expect ext-value')
      : this.expect(this.parseValue(), 'expect value');
    return { key, value };
  }

  // content-disposition = "Content-Disposition" ":"
  //                        disposition-type *( ";" disposition-parm )
  parse(): ParseResult {
    this.chunk = String(this.code);
    if (!this.parseAttachment()) {
      return { attachment: false };
    }

    const parms: Record<string, string> = {};
    const extParms: Record<string, string> = {};
    this.eatSpaces();
    while (this.eat$0(/^;/)) {
      this.eatSpaces();
      let { key, value } = this.parseParm();
      let isExtValue = false;
      if (/\*$/.test(key)) {
        key = key.slice(0, -1);
        isExtValue = true;
      }
      // strangely, RFC6266 does not mention if disposition parameters
      // other than "filename" and "filename*" should be matched case-insensitively
      if (/^filename$/i.test(key)) key = key.toLowerCase();
      const target = isExtValue ? extParms : parms;
      if (key in target) {
        throw new ParseError(`duplicated field '${key}'`);
      }
      target[key] = value;
    }
    if (this.chunk.length) {
      throw new ParseError('expect EOF');
    }
    return {
      // TypeScript limitations
      attachment: true as unknown as any,
      ...parms,
      // always prefers "exts"
      ...extParms,
    };
  }
}

export const parse = (code: string) => {
  return new Parser(code).parse();
};
