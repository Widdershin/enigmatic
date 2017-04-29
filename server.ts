import {timeDriver, TimeSource} from '@cycle/time';
import {run} from '@cycle/run';
import {Server} from 'ws';
import xs, {Stream} from 'xstream';

type Message = {
}

function makeWebSocketServerDriver (port: number) {
  return function webSocketServerDriver (sink$: Stream<Message>): Stream<Message> {
    const server = new Server({
      port
    });

    console.log(`Listening on port :${port}`);;
    const sources$ = xs.create<Message>();

    (server as any).on('connection', function connection (ws: any) {
      console.log(`New connection`);
      ws.on('message', function incoming (message: any) {
        let parsedMessage;

        try {
          parsedMessage = JSON.parse(message);
          console.log('received: %s', parsedMessage);
        } catch (e) {
          console.error(`Failed to parse "${message}"`);
        }

        if (parsedMessage) {
          sources$.shamefullySendNext(parsedMessage);
        }
      });

      const listener = {
        next (message: Message) {
          ws.send(JSON.stringify(message));
        },

        error (err: Error) {
          console.error(err);
        },

        complete () {
        }
      }

      sink$.addListener(listener);

      ws.on('close', () => {
        sink$.removeListener(listener);
      });
    });

    return sources$;
  }
}

const drivers = {
  Time: timeDriver,
  Socket: makeWebSocketServerDriver(8080)
}

type Sources = {
  Socket: Stream<Message>;
  Time: TimeSource;
}

type Sinks = {
  Socket: Stream<Message>;
}

function main (sources: Sources): Sinks {
  return {
    Socket: sources.Time.periodic(1000)
  }
}

run(main, drivers);
