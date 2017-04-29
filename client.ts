import {makeDOMDriver, DOMSource, VNode, div} from '@cycle/dom';
import {timeDriver, TimeSource} from '@cycle/time';
import {run} from '@cycle/run';
import xs, {Stream} from 'xstream';

type Message = {
}

function makeWebSocketDriver (uri: string) {
  return function webSocketDriver (sink$: Stream<Message>): Stream<Message> {
    const socket = new WebSocket(uri);
    socket.onerror = (error: any) => console.error('Web socket error', error);

    console.log('made a socket');
    return xs.create<Message>({
      start (listener) {
        console.log('sources connected');
        socket.onopen = function () {
          sink$.addListener({
            next (message: Message) {
              socket.send(JSON.stringify(message));
            },

            error (error: Error) {
              console.error('websocket error', error);
            },

            complete () {
            }
          });
        }

        socket.onmessage = function handleMessage(message: MessageEvent) {
          listener.next(JSON.parse(message.data));
        }
      },

      stop () {
      }
    });
  }
}

function logDriver (sink$: Stream<any>) {
  sink$.addListener({
    next (event: any) {
      console.log('Log:', event);
    }
  });
}

const drivers = {
  Socket: makeWebSocketDriver('ws://localhost:8080'),
  DOM: makeDOMDriver('.app'),
  Time: timeDriver,
  Log: logDriver
}

type Sources = {
  Socket: Stream<Message>;
  DOM: DOMSource;
  Time: TimeSource;
}

type Sinks = {
  DOM: Stream<VNode>;
  Socket: Stream<Message>;
}

function view (message: Message) {
  return div('.message', message);
}
function main (sources: Sources): Sinks {
  return {
    DOM: sources.Socket.debug('wow').map(view),
    Socket: xs.of('hi')
  }
}

run(main, drivers);
