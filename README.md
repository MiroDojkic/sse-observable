# sse-observable
fetch-based SSE client/EventSource with event emitter interface (WIP :warning:)

### Example
```javascript
const connectSSE = require('sse-observable');

const sse = connectSSE('/sse/endpoint/', {
  headers: { Authorization: 'Bearer ...' }
});

sse.on('open', () => console.log('SSE connection openned! :tada:'));
sse.on('message', ({ data, lastEventId }) => data));
sse.on('custom-event', ({ data, lastEventId }) => data));
sse.on('error', err => console.log('SSE connection failed: ', err));
```
