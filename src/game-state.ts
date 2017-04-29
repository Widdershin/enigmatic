
export type GameState = {
  players: PlayerState[];
  settlements: Settlement[];
  units: Unit[];
  width: number;
  height: number;
}

export type Position = {
  row: number;
  column: number;
}

export type Direction = {
  row: 1 | 0 | -1,
  column: 1 | 0 | -1
}

export type PlayerId = string;

export type PlayerState = {
  id: PlayerId;
}

export type Settlement = {
  type: 'base' | 'city' | 'village';
  ownerId: null | PlayerId;
  position: Position;
}

export type Unit = {
  type: 'soldier';
  ownerId: null | PlayerId;
  position: Position;
}

export type Action = MoveAction;

export type MoveAction = {
  type: 'move',
  playerId: PlayerId,
  from: Position,
  direction: Direction,
  numberOfTroops: number
}

function makeGameState (): GameState {
  return {
    width: 5,
    height: 5,

    players: [
      {id: 'red'},
      {id: 'blue'}
    ],
    settlements: [
      {type: 'base', ownerId: 'red', position: {row: 0, column: 2}},
      {type: 'base', ownerId: 'blue', position: {row: 4, column: 2}},
      {type: 'city', ownerId: null, position: {row: 2, column: 2}},
      {type: 'village', ownerId: null, position: {row: 2, column: 0}},
      {type: 'village', ownerId: null, position: {row: 2, column: 4}}
    ],
    units: [
      {type: 'soldier', ownerId: 'red', position: {row: 0, column: 2}},
      {type: 'soldier', ownerId: 'red', position: {row: 0, column: 2}},
      {type: 'soldier', ownerId: 'blue', position: {row: 4, column: 2}},
      {type: 'soldier', ownerId: 'blue', position: {row: 4, column: 2}}
    ]
  }
}

export function update (state: GameState, actions: Action[]) {
  return actions.reduce(applyAction, state);
}

const reducers = {
  move (state: GameState, action: Action): GameState {
    const possibleSoldiersToMove = state.units.filter((unit: Unit) =>
      unit.ownerId === action.playerId && samePosition(unit.position, action.from)
    );

    possibleSoldiersToMove.slice(0, action.numberOfTroops).forEach((unit: Unit) => {
      unit.position.row += action.direction.row;
      unit.position.column += action.direction.column;
    });

    return state;
  }
}

function samePosition (a: Position, b: Position): boolean {
  return a.row === b.row && a.column === b.column;
}

function applyAction (state: GameState, action: Action): GameState {
  return reducers[action.type](state, action);
}

function toString(gameState: GameState): string {
  const rows = new Array(gameState.width).fill(new Array(gameState.height).fill(0));

  const rowDivider = new Array(gameState.width * 4 + 1).fill('-').join('');

  const renderedRows =  rows.map((arr, row) => {
    const cells = arr.map((_: any, column: number) => {
      const settlement : Settlement | undefined = gameState.settlements.find(settlement => settlement.position.row === row && settlement.position.column === column);
      const units : Unit[] = gameState.units.filter(unit => samePosition(unit.position, {row, column}));

      if (settlement) {
        const soldierCount = units.filter((unit: Unit) => unit.position.row === settlement.position.row && unit.position.column === settlement.position.column).length;

        return [
          `| ${(settlement.ownerId || ' ').slice(0, 1)}${soldierCount > 0 ? soldierCount : ' '}`,
          `| ${settlementAscii(settlement)} `
        ];
      }

      if (units.length > 0) {
        return [
          `| ${(units[0].ownerId || ' ').slice(0, 1)}${units.length > 0 ? units.length : ' '}`,
          `|   `
        ];
      }

      return [
        '|   ',
        '|   '
      ];
    });

    return [
      cells.map((stuff: string[]) => stuff[0]).join('') + '|',
      cells.map((stuff: string[]) => stuff[1]).join('') + '|',
      rowDivider
    ].join('\n');
  });

  return [
    rowDivider,
    ...renderedRows
  ].join('\n');
}

function settlementAscii (settlement: Settlement): string {
  return {
    'base': '#',
    'city': '@',
    'village': '^'
  }[settlement.type];
}

export {
  makeGameState,
  toString
}
