import mitt from 'mitt';
import pump from 'pump';
import { ReadableWebToNodeStream } from 'readable-web-to-node-stream';
import split from 'split2';
import to from 'to2';

function createClient() {
  const emitter = mitt();
  let lastEventId;

  function emitEvent(buf, enc, next) {
    const message = buf.toString();
    if (message.startsWith(':')) return next();
    const fields = message.split(/[\r\n]/);
    let event = 'message';
    const data = [];
    fields.forEach(parseField);
    emitter.emit(event, { lastEventId, event, data });
    next();

    function parseField(field) {
      const [, name, value] = field.match(/^(data|id|event):?\s*(.*)s*/);
      if (name === 'data') data.push(value);
      if (!value) return;
      if (name === 'event') { event = value; }
      if (name === 'id') { lastEventId = value; }
    }
  }

  function subscribe(path, opts) {
    return window.fetch(path, opts)
      .then(response => pump(
        new ReadableWebToNodeStream(response.body),
        split('\n\n'),
        to(emitEvent)
      ));
  }

  return { ...emitter, subscribe };
}

export default createClient;
