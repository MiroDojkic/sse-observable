import mitt from 'mitt';
import pump from 'pump';
import { ReadableWebToNodeStream } from 'readable-web-to-node-stream';
import split from 'split2';
import to from 'to2';

function createObservable(path) {
  const emitter = mitt();
  let lastEventId;

  function emitEvent(buf, enc, next) {
    const message = buf.toString();
    if (message.startsWith(':')) return next();
    const lines = message.split(/[\r\n]/);
    let event = 'message';
    const data = [];
    lines.forEach(parseLine);
    emitter.emit(event, { lastEventId, event, data });
    next();

    function parseLine(line) {
      const field = line.match(/^(data|id|event):?\s*(.*)s*/);
      if (!field) return;
      const [, name, value] = field;
      if (name === 'data') data.push(value);
      if (!value) return;
      if (name === 'event') { event = value; }
      if (name === 'id') { lastEventId = value; }
    }
  }

  function disposeListeners(error) {
    emitter.emit('error', error);
    emitter.all.clear();
  }

  function connect(opts) {
    return window.fetch(path, opts)
      .then(response => {
        if (!response.ok) {
          emitter.emit('error');
          throw new Error(`Failed to connect to SSE endpoint: ${path}`);
        }
        emitter.emit('open');
        return pump(
          new ReadableWebToNodeStream(response.body),
          split('\n\n'),
          to(emitEvent),
          disposeListeners
        );
      });
  }

  return { ...emitter, connect };
}

export default createObservable;
