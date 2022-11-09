import { parse } from 'content-disposition-attachment';

console.log(parse('attachment; filename="foo.html"'));
