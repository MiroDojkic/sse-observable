import mitt from 'mitt';
import pump from 'pump';
import { ReadableWebToNodeStream } from 'readable-web-to-node-stream';
import split from 'split2';
import to from 'to2';

const states = {
  CONNECTING: 'CONNECTING',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED'
};
const DEFAULT_RECONNECTION_DELAY = 30000;

function createObservable(path, opts) {
  const emitter = mitt();
  let readyState = states.CONNECTING;
  let reconnectDelay = DEFAULT_RECONNECTION_DELAY;
  let lastEventId;
  const controller = new AbortController();
  const { signal } = controller;
  const headers = new Headers(opts.headers);
  const request = new Request(path);
  emitter.on('error', removeListeners);
  connect();
  return { ...emitter, close, readyState, url: request.url };

  function close() {
    controller.abort();
    readyState = states.CLOSED;
    emitter.emit('error');
  }

  function connect() {
    if (lastEventId) headers.set('Last-Event-ID', lastEventId);
    return window.fetch(request, { ...opts, headers, signal })
      .then(response => {
        if (!response.ok || response.status === 204) return close();
        readyState = states.OPEN;
        emitter.emit('open');
        return pump(
          new ReadableWebToNodeStream(response.body),
          split('\n\n'),
          to(emitEvent),
          retryConnect
        );
      });
  }

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
      if (name === 'retry') reconnectDelay = value;
      if (name === 'event') { event = value; }
      if (name === 'id') { lastEventId = value; }
    }
  }

  function retryConnect(error) {
    if (readyState !== states.OPEN) return close();
    readyState = states.CONNECTING;
    return setTimeout(connect, reconnectDelay);
  }

  function removeListeners(error) {
    emitter.emit('error', error);
    emitter.all.clear();
  }
}

export default createObservable;
