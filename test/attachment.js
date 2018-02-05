import test from 'ava'
import { parse, ParseError } from '../index.js'

const keySet = new Set()

const t = new Proxy(Object.create(null), {
  get (target, key) {
    if (keySet.has(key)) {
      throw Error(`test ${key} exists`)
    } else {
      keySet.add(key)
    }
    return strings => expected => test(key, t => {
      const parseInput = () => parse(strings.raw[0])
      if (expected instanceof RegExp) {
        const error = t.throws(parseInput, ParseError, 'should throw a ParseError')
        t.regex(error.message, expected)
      } else {
        t.deepEqual(parseInput(), expected)
      }
    })
  }
})

// test cases from http://test.greenbytes.de/tech/tc2231/#attwithasciifnescapedchar

// 'attachment' only
t.attonly`attachment`({ attachment: true })

// 'attachment' only, using double quotes
t.attonlyquoted`"attachment"`({ attachment: false })

// 'ATTACHMENT' only
t.attonlyucase`ATTACHMENT`({ attachment: true })

// 'attachment', specifying a filename of foo.html
t.attwithasciifilename`attachment; filename="foo.html"`({
  attachment: true,
  filename: 'foo.html'
})

// 'attachment', specifying a filename of 0000000000111111111122222 (25 characters)
t.attwithasciifilename25`attachment; filename="0000000000111111111122222"`({
  attachment: true,
  filename: '0000000000111111111122222'
})

// 'attachment', specifying a filename of f\oo.html (the first 'o' being escaped)
t.attwithasciifnescapedchar`attachment; filename="f\oo.html"`({
  attachment: true,
  filename: 'foo.html'
})

// 'attachment', specifying a filename of \"quoting\" tested.html (using double quotes around "quoting" to test... quoting)
t.attwithasciifnescapedquote`attachment; filename="\"quoting\" tested.html"`({
  attachment: true,
  filename: '"quoting" tested.html'
})

// 'attachment', specifying a filename of \"quoting\" tested.html (using double quotes around "quoting" to test... quoting)
t.attwithquotedsemicolon`attachment; filename="Here's a semicolon;.html"`({
  attachment: true,
  filename: 'Here\'s a semicolon;.html'
})

// 'attachment', specifying a filename of foo.html and an extension parameter "foo" which should be ignored (see Section 4.4 of RFC 6266.).
t.attwithfilenameandextparam`attachment; foo="bar"; filename="foo.html"`({
  attachment: true,
  foo: 'bar',
  filename: 'foo.html'
})

// 'attachment', specifying a filename of foo.html and an extension parameter "foo" which should be ignored (see Section 4.4 of RFC 6266.).
// In comparison to attwithfilenameandextparam, the extension parameter actually uses backslash - escapes.This tests whether the UA properly skips the parameter.
t.attwithfilenameandextparamescaped`attachment; foo="\"\\";filename="foo.html"`({
  attachment: true,
  foo: '"\\',
  filename: 'foo.html'
})

// 'attachment', specifying a filename of foo.html
t.attwithasciifilenameucase`attachment; FILENAME="foo.html"`({
  attachment: true,
  filename: 'foo.html'
})

// 'attachment', specifying a filename of foo.html using a token instead of a quoted-string.
t.attwithasciifilenamenq`attachment; filename=foo.html`({
  attachment: true,
  filename: 'foo.html'
})

// 'attachment', specifying a filename of foo,bar.html using a comma despite using token syntax.
t.attwithtokfncommanq`attachment; filename=foo,bar.html`(/^expect EOF$/)

// 'attachment', specifying a filename of foo.html using a token instead of a quoted-string, and adding a trailing semicolon.
t.attwithasciifilenamenqs`attachment; filename=foo.html ;`(/^expect EOF$/)

// 'attachment', specifying a filename of foo, but including an empty parameter.
t.attemptyparam`attachment; ;filename=foo`(/^expect token$/)

// 'attachment', specifying a filename of foo bar.html without using quoting.
t.attwithasciifilenamenqws`attachment; filename=foo bar.html`(/^expect EOF$/)

// 'attachment', specifying a filename of 'foo.bar' using single quotes.
t.attwithfntokensq`attachment; filename='foo.bar'`({
  attachment: true,
  filename: '\'foo.bar\''
})

// 'attachment', specifying a filename of foo-ä.html, using plain ISO-8859-1
t.attwithisofnplain`attachment; filename="foo-ä.html"`({
  attachment: true,
  filename: 'foo-ä.html'
})

// 'attachment', specifying a filename of foo-Ã¤.html, which happens to be foo-ä.html using UTF-8 encoding.
t.attwithutf8fnplain`attachment; filename="foo-Ã¤.html"`({
  attachment: true,
  filename: 'foo-Ã¤.html'
})

// 'attachment', specifying a filename of foo-%41.html
t.attwithfnrawpctenca`attachment; filename="foo-%41.html"`({
  attachment: true,
  filename: 'foo-%41.html'
})

// 'attachment', specifying a filename of 50%.html
t.attwithfnusingpct`attachment; filename="50%.html"`({
  attachment: true,
  filename: '50%.html'
})

// 'attachment', specifying a filename of foo.html, with one blank space before the equals character.
t.attwithasciifilenamews1`attachment; filename ="foo.html"`({
  attachment: true,
  filename: 'foo.html'
})

// 'attachment', specifying a filename of foo.html, with one blank space before the equals character.
t.attwith2filenames`attachment; filename="foo.html"; filename="bar.html"`(/^duplicated field 'filename'$/)

// 'attachment', specifying a filename of foo[1](2).html, but missing the quotes. Also, "[", "]", "(" and ")"
// are not allowed in the HTTP token production.
t.attfnbrokentoken`attachment; filename=foo[1](2).html`(/^expect EOF$/)

// 'attachment', specifying a filename of foo-ä.html, but missing the quotes.
t.attfnbrokentokeniso`attachment; filename=foo-ä.html`(/^expect EOF$/)

// Both disposition types specified.
t.attandinline2`attachment; inline; filename=foo.html`(/^expect '='$/)

// 'attachment', specifying a filename parameter that is broken (missing ending double quote).
// This is invalid syntax.
t.attbrokenquotedfn2`attachment; filename="bar`(/^expect '"'$/)
