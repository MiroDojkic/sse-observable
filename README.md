# sse-observable
fetch-based SSE client/EventSource with event emitter interface (WIP :warning:)

### Example
```javascript
const sse = require('sse-observable')('/sse/endpoint');

sse.on('open', () => console.log('SSE connection openned! :tada:'));
sse.on('message', ({ data, lastEventId }) => doSomething(data));
sse.on('custom-event', ({ data, lastEventId }) => doSomething(data));
sse.on('error', err => console.log('SSE connection failed: ', err));

sse.connect({
  headers: { Authorization: 'Bearer ...' }
});
```
