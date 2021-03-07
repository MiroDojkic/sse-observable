import * as tape from 'tape';
import tapSpec from 'tap-spec';
import miss from 'mississippi';
import split from 'split2';
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
    miss.through.obj((chunk: ParsedSSE, _: BufferEncoding, next: Function) => {
      t.equal(toInt(chunk.lastEventId), 1);
      next();
    })
  )
});

function fromString(string: string): ReadableStream {
  return miss.from(function(size: number, next: Function) {
    // if there's no more content
    // left in the string, close the stream.
    if (string.length <= 0) return next(null, null)

    // Pull in a new chunk of text,
    // removing it from the string.
    const chunk = string.slice(0, size)
    string = string.slice(size)

    // Emit "chunk" from the stream.
    next(null, chunk)
  })
}

function toInt(string: string) {
  return parseInt(string, 10);
}
