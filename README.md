# sse-observable
fetch-based SSE client/EventSource with event emitter interface (WIP :warning:)

## Install
```sh
$ npm install --save sse-observable
```

## Usage
```javascript
const connectSSE = require('sse-observable');

const sse = connectSSE('/sse/endpoint/', {
  headers: { Authorization: 'Bearer ...' }
});

sse.on('open', () => console.log('SSE connection openned! 🎉'));
sse.on('message', data => {}));
sse.on('custom-event', data => {}));
sse.on('error', err => console.log('SSE connection failed: ', err));
```

## License
[MIT License](https://opensource.org/licenses/MIT)
