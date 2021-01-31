import through from 'through2';

const defaultEvent = { event: 'message', data: [] };

function parse() {
  return through.obj((chunk, _, next) => {
    const message = chunk.toString();
    const lines = message.split(/[\r\n]/);
    const data = [];
    const event = lines
      .map(parseLine)
      .filter(Boolean)
      .reduce(toEvent, defaultEvent);
    next(null, event);
  });
}

export default parse;

function parseLine(line) {
  if (!line) return;
  const isComment = line.startsWith(':');
  if (isComment) return;
  const field = line.match(/^(data|id|event):?\s?(.*)s*/);
  if (!field) return { name: line };
  const [, name, value] = field;
  return { name, value };
}

function toEvent(event, { name, value }) {
  if (name === 'data') return { ...event, data: [...event.data, ...value] };
  if (!value) return event;
  if (name === 'retry') return { ...event, reconnectDelay: value };
  if (name === 'event') return { ...event, event: value };
  if (name === 'id') return { ...event, lastEventId: value ? value : '' };
}

