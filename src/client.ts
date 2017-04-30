import {makeDOMDriver, DOMSource, VNode, pre, div, button} from '@cycle/dom';
import {timeDriver, TimeSource} from '@cycle/time';
import {run} from '@cycle/run';
import xs, {Stream} from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';

import {samePosition, Action, PurchaseAction, MoveAction, GameState, PlayerState, Position, Direction, Settlement, Unit} from './game-state';
import {MessageToServer, MessageFromServer, UpdateGameStateMessage} from '../common-types';

export type Sources = {
  Socket: Stream<MessageFromServer>;
  DOM: DOMSource;
  Time: TimeSource;
}

export type Sinks = {
  DOM: Stream<VNode>;
  Socket: Stream<MessageToServer>;
  Log: Stream<any>;
  localState$: Stream<State>;
}

export type State = {
  actions: Action[],
  gameState: null | GameState,
  selection: null | {position: Position, numberOfTroops: number}
}

type Reducer<T> = (state: T) => T;

const moneyEmoji = String.fromCodePoint(0x1F4B0);

function manyMoney (n: number) {
  return new Array(n).fill(moneyEmoji).join('');
}

function view ([state, localState, hoverPosition]: [GameState, State, Position | null]): VNode {
  const player = state.players.find(player => player.id === 'blue') as PlayerState;
  const purchases = localState.actions
    .filter(action => action.type === 'purchase')

  const amountSpent = purchases
    .map((action: PurchaseAction) => action.cost * action.quantity)
    .reduce((acc, val) => acc + val, 0);

  return div('.game', [
    renderGameState(state, localState, hoverPosition),
    div('.sidebar', [
      div('.name', 'blue'),
      div('.money', manyMoney(player.money - amountSpent)),
      div('.purchases', [
        div('.header', 'Purchase: '),
        button('.purchase.soldier', `${moneyEmoji} Soldier`),
        button('.purchase.encryption', `${manyMoney(3)} Encryption`),
        button('.purchase.decryption', `${manyMoney(4)} Decryption`),
        div('.record', purchases.map((purchase: PurchaseAction) =>
          div('.purchase', [
            `${manyMoney(purchase.cost * purchase.quantity)} - ${purchase.purchaseType} x ${purchase.quantity}`
          ])
        ))
      ])
    ])
  ]);
}

function subtract (a: Position, b: Position): Position {
  return {
    row: a.row - b.row,
    column: a.column - b.column
  }
}

function add (a: Position, b: Position): Position {
  return {
    row: a.row + b.row,
    column: a.column + b.column
  }
}

function renderGameState (state: GameState, localState: State, hoverPosition: Position | null): VNode {
  const rows = Array(state.height).fill(Array(state.width).fill(0));

  return (
    div('.state', rows.map((cells: any[], row: number) =>
      div('.row', cells.map((_: any, column: number) =>
        renderCell(state, localState, {row, column}, !!(hoverPosition && samePosition(hoverPosition, {row, column})))
      ))
    ))
  )
}

function renderCell (state: GameState, localState: State, position: Position, isBeingHovered: boolean): VNode {
  const settlement = state.settlements.find((settlement: Settlement) => samePosition(settlement.position, position));
  const units = state.units.filter((unit: Unit) => samePosition(unit.position, position));
  const unitsOrderedToMoveHere = localState.actions
    .filter((action: Action) => action.type === 'move')
    .filter((action: MoveAction) => samePosition(
      position,
      add(action.from, (action.direction as Position))
    ))
  const unitsOrderedToMoveAway = localState.actions
    .filter((action: Action) => action.type === 'move')
    .filter((action: MoveAction) => samePosition(
      position,
      action.from
    ))
    .map((action: MoveAction) => action.numberOfTroops)
    .reduce((acc, val) => acc + val, 0);

  const player = (settlement && settlement.ownerId) || units.length > 0 && units[0].ownerId;
  const style : any = {};

  if (player) {
    style.filter = player === 'blue' ? `hue-rotate(120deg)` : `hue-rotate(315deg) saturate(400%)`;
  }

  let arrows : VNode[] = [];
  let isSelected = localState.selection && samePosition(position, localState.selection.position);

  if (isBeingHovered) {
    if (localState.selection) {
    const distanceFromSelection = subtract(position, localState.selection.position);

    if (Math.max(Math.abs(distanceFromSelection.row), Math.abs(distanceFromSelection.column)) <= 1 && Math.abs(distanceFromSelection.row) + Math.abs(distanceFromSelection.column) !== 0) {
        // muahaha
        arrows.push(div(
          '.arrow',
          {
            style: {
              transform: `translate(${40 * -distanceFromSelection.column}px, ${40 * -distanceFromSelection.row}px)`
            }
          },
          [
            div('.arrow-emoji', {style: {transform: ` rotate(${Math.atan2(distanceFromSelection.row, distanceFromSelection.column)}rad`}}, String.fromCodePoint(0x27A1)),
            div('.content', `x ${localState.selection.numberOfTroops}`)
          ]
        ))
      }
    }
  }


  unitsOrderedToMoveHere.forEach((action: MoveAction) => {
    arrows.push(div(
      '.arrow',
      {
        style: {
          transform: `translate(${40 * -action.direction.column}px, ${40 * -action.direction.row}px)`
        }
      },
      [
        div('.arrow-emoji', {style: {transform: ` rotate(${Math.atan2(action.direction.row, action.direction.column)}rad`}}, String.fromCodePoint(0x27A1)),
        div('.content', `x ${action.numberOfTroops}`)
      ]
    ))
  });

  const troopsCount = units.length - unitsOrderedToMoveAway;

  return (
    div('.cell', {class: {selected: isSelected, hover: isBeingHovered && localState.selection}, dataset: {row: position.row.toString(), column: position.column.toString()}}, [
      ...arrows,
      div('.settlement', {style}, settlement ? renderSettlement(settlement) : ''),
      div('.unit', {style}, troopsCount > 0 ? `💂 x ${troopsCount}` : '')
    ])
  )
}

function renderSettlement (settlement: Settlement): string {
  return {
    'village': '🏘️',
    'city': '🌆',
    'base': '⛺'
  }[settlement.type];
}

function applyReducer (state: State, reducer: Reducer<State>): State {
  return reducer(state);
}

function purchaseSoldier (): Reducer<State> {
  return function (state: State): State {
    const existingAction = state.actions.find(action => action.type === 'purchase' && action.purchaseType === 'soldier')

    if (existingAction) {
      return {
        ...state,

        actions: state.actions.map(action => action.type === 'purchase' && (action === existingAction) ? ({...action, quantity: action.quantity + 1}) : action)
      }
    }
    return {
      ...state,

      actions: state.actions.concat({type: 'purchase', purchaseType: 'soldier', playerId: 'blue', cost: 1, quantity: 1})
    }
  }
}

function cellClickReducer (clickPosition: Position): Reducer<State> {
  return function (state: State): State {
    const unitsOrderedToMoveAway = state.actions
      .filter((action: Action) => action.type === 'move')
      .filter((action: MoveAction) => samePosition(
        clickPosition,
        action.from
      ))
      .map((action: MoveAction) => action.numberOfTroops)
      .reduce((acc, val) => acc + val, 0);

    let troopsAtPosition : Unit[] = [];

    if (state.gameState) {
      troopsAtPosition = state.gameState.units.filter((unit: Unit) => samePosition(unit.position, clickPosition) && unit.ownerId === 'blue');
    }

    if (state.selection === null) {
      if (troopsAtPosition.length - unitsOrderedToMoveAway === 0) {
        return state;
      }

      return {
        ...state,

        selection: {
          position: clickPosition,
          numberOfTroops: 1
        }
      };
    }

    if (samePosition(state.selection.position, clickPosition)) {
      return {
        ...state,

        selection: {
          ...state.selection,

          numberOfTroops: state.selection.numberOfTroops + 1
        }
      }
    } else {
      const distance = subtract(state.selection.position, clickPosition);
      const distanceFromSelection = subtract(state.selection.position, clickPosition);

      if (Math.max(Math.abs(distanceFromSelection.row), Math.abs(distanceFromSelection.column)) <= 1) {
        return {
          ...state,

          actions: state.actions.concat({
            type: 'move',
            playerId: 'blue',
            from: state.selection.position,
            direction: (subtract(clickPosition, state.selection.position) as Direction),
            numberOfTroops: state.selection.numberOfTroops
          }),

          selection: null
        }
      } else {
         return { ...state };
      }
    }
  }
}

function positionFromEvent (ev: Event): Position {
  return {
    row: parseInt((ev.currentTarget as any).dataset.row, 10),
    column: parseInt((ev.currentTarget as any).dataset.column, 10)
  };
}

export function Client (sources: Sources): Sinks {
  const initialState = {
    actions: [],
    selection: null,
    gameState: null
  }

  const cellClick$ = sources.DOM
    .select('.cell')
    .events('click')
    .map(positionFromEvent)
    .map(cellClickReducer)

  const state$ = sources.Socket
    .filter((message: MessageFromServer) => message.type === 'updateGameState')
    .map((message: UpdateGameStateMessage) => message.gameState)

  const processActions$ = sources.Socket
    .filter((message: MessageFromServer) => message.type === 'processActions')
    .map((message) => (state: State): State => {
      return {
        ...state,

        actions: []
      }
    });

  const purchaseSoldier$ = sources.DOM
    .select('.purchase.soldier')
    .events('click')
    .map(purchaseSoldier);

  const reducer$ = xs.merge(
    cellClick$,
    state$.map((gameState: GameState) => (state: State): State => {
      return {
        ...state,
        gameState
      };
    }),
    purchaseSoldier$,
    processActions$
  );

  const hoverCell$ = sources.DOM
    .select('.cell')
    .events('mouseover')
    .map(positionFromEvent)

  const exitCell$ = sources.DOM
    .select('.cell')
    .events('mouseleave')
    .mapTo(null);

  const hoveredCell$ = xs.merge(
    hoverCell$,
    exitCell$
  ).startWith(null);

  const localState$ = reducer$.fold(applyReducer, initialState)
    .compose(dropRepeats((a: any, b: any) => JSON.stringify(a) === JSON.stringify(b)));;

  const Socket = localState$
    .map(state => ({type: 'updateActions', actions: state.actions}))
    .compose(dropRepeats());

  return {
    DOM: xs.combine(state$, localState$, hoveredCell$).map(view),
    Socket,
    Log: localState$,
    localState$
  }
}
