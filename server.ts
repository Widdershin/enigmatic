import {timeDriver, TimeSource} from '@cycle/time';
import {run} from '@cycle/run';
import {Server} from 'ws';
import xs, {Stream} from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';

import {makeGameState, update, GameState, PlayerId, Action} from './src/game-state';
import {MessageToServer, MessageFromServer} from './common-types';

function makeWebSocketServerDriver (port: number) {
  return function webSocketServerDriver (sink$: Stream<MessageFromServer>): SocketSource {
    const server = new Server({
      port
    });

    const sources$ = xs.create<MessageToServer>();
    const connection$ = xs.create<string>();
    const possibleIds = ['blue', 'red'];
    let playerCount = 0;

    (server as any).on('connection', function connection (ws: any) {
      const playerId = possibleIds[playerCount % possibleIds.length];
      playerCount += 1;

      connection$.shamefullySendNext('');

      console.log(`New connection`);
      ws.on('message', function incoming (message: any) {
        let parsedMessage;

        try {
          parsedMessage = JSON.parse(message);
          console.log('received: %s', message);
        } catch (e) {
          console.error(`Failed to parse "${message}"`);
        }

        if (parsedMessage) {
          parsedMessage.playerId = playerId;
          sources$.shamefullySendNext(parsedMessage);
        }
      });

      const listener = {
        next (message: MessageFromServer) {
          message.playerId = playerId;

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

    return {
      messages () { return sources$; },
      connections () { return connection$; }
    }
  }
}

const drivers = {
  Time: timeDriver,
  Socket: makeWebSocketServerDriver(8080)
}

type SocketSource = {
  messages (): Stream<MessageToServer>;
  connections (): Stream<string>;
}

type Sources = {
  Socket: SocketSource
  Time: TimeSource;
}

type Sinks = {
  Socket: Stream<MessageFromServer>;
}

type State = {
  gameState: GameState,
  actions: {[playerId: string]: Action[]}
}

type Reducer<T> = (state: T) => T;


function updateActions (message: MessageToServer) {
  return function (state: State): State {
    return {
      ...state,
      actions: {
        ...state.actions,

        [message.playerId as PlayerId]: message.actions
      }
    }
  }
}

function applyReducer (state: State, reducer: Reducer<State>) {
  return reducer(state);
}

function processActions () {
  return function (state: State): State {
    return {
      ...state,

      gameState: Object
        .keys(state.actions)
        .map(key => state.actions[key])
        .reduce((gameState: GameState, actions: Action[]) => update(gameState, actions), state.gameState),

      actions: {}
    }
  }
}

function main (sources: Sources): Sinks {
  const initialState = {
    gameState: makeGameState(),
    actions: {},
    money: 3
  };

  const updateActions$ = sources.Socket
    .messages()
    .filter(message => message.type === 'updateActions')
    .map(updateActions);

  const processAction$ = sources.Time.periodic(10000)
    .map(processActions);

  const reducer$ = xs.merge(
    updateActions$,
    processAction$
  );

  const state$ = reducer$.fold(applyReducer, initialState);

  const updateActionMessage$ = state$
    .map(state => state.actions)
    .compose(dropRepeats((a: any, b: any) => JSON.stringify(a) === JSON.stringify(b)))
    .map(actions => ({type: 'updateActions', actions}));

  const processActionsMessage$ = processAction$
    .mapTo({type: 'processActions'});

  const updateGameStateMessage$ = state$
    .map(state => state.gameState)
    .map(gameState => ({type: 'updateGameState', gameState}))
    .remember();


  const Socket = xs.merge(
    updateActionMessage$,

    updateGameStateMessage$,

    sources.Socket.connections().map(() => updateGameStateMessage$.take(1)).flatten(),

    processActionsMessage$
  );

  return {
    Socket
  };
}

run(main, drivers);
