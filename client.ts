import {makeDOMDriver, DOMSource, VNode, pre, div} from '@cycle/dom';
import {timeDriver, TimeSource} from '@cycle/time';
import {run} from '@cycle/run';
import xs, {Stream} from 'xstream';

import {Client} from './src/client';

import {samePosition, GameState, Position, Settlement, Unit} from './src/game-state';

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
              console.log('sending:', JSON.stringify(message));
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
          console.log('Received', message.data);
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

function main (sources: any): any {
  return Client(sources);
}


run(main, drivers);
