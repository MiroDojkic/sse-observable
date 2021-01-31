import mitt from 'mitt';
import pump from 'pump';
import { ReadableWebToNodeStream } from 'readable-web-to-node-stream';
import split from 'split2';
import parseSSE from './sse-parser';
import through from 'through2';

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
          parseSSE(),
          emitEvent(),
          retryConnect
        );
      });
  }

  function emitEvent() {
    return through.obj((chunk, _, next) => {
      const { event, data } = chunk;
      if (chunk.id) lastEventId = chunk.id;
      if (chunk.reconnectDelay) reconnectDelay = chunk.reconnectDelay;
      emitter.emit(event, data);
      next();
    });
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

