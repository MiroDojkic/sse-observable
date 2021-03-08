import * as tape from 'tape';
// @ts-ignore
import tapSpec from 'tap-spec';
// @ts-ignore
import miss from 'mississippi';
import * as through from 'through2';
import * as split from 'split2';
import parse from './sse-parser';

const test = tape.createHarness();
test.createStream()
  .pipe(tapSpec())
  .pipe(process.stdout);

type ParsedSSE = {
  lastEventId: string,
  data: string[],
  event: string
}

test('It returns SSE', t => {
  t.plan(1);
  const sseStream = 'id: 1\ndata: whatevs\n\n';
  miss.pipe(
    fromString(sseStream),
    split('\n\n'),
    parse(),
    through.obj((chunk: ParsedSSE, _, next) => {
      t.equal(toInt(chunk.lastEventId), 1);
      next();
    })
  )
});


function fromString(string: string): ReadableStream {
  return miss.from((size: number, next: through.TransformCallback) => {
    if (string.length <= 0) return next(null, null);
    const chunk = string.slice(0, size);
    string = string.slice(size);
    next(null, chunk);
  })
}

function toInt(string: string) {
  return parseInt(string, 10);
}
