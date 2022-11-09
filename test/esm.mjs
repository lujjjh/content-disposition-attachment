import test from 'ava';
import { parse } from 'content-disposition-attachment';

test('import', (t) => {
  t.deepEqual(parse('attachment; filename="foo.html"'), { attachment: true, filename: 'foo.html' });
});
