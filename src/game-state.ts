
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
  money: number;
}

export type SettlementType = 'base' | 'city' | 'village';

export type Settlement = {
  type: SettlementType;
  ownerId: null | PlayerId;
  position: Position;
}

export type Unit = {
  type: 'soldier';
  ownerId: null | PlayerId;
  position: Position;
}

export type Action = MoveAction | PurchaseAction;

export type MoveAction = {
  type: 'move',
  playerId: PlayerId,
  from: Position,
  direction: Direction,
  numberOfTroops: number
}

export type PurchaseAction = {
  type: 'purchase',
  purchaseType: 'soldier' | 'encryption' | 'decryption',
  playerId: PlayerId;
  cost: number,
  quantity: number
}

function makeGameState (): GameState {
  return {
    width: 5,
    height: 5,

    players: [
      {id: 'red', money: 3},
      {id: 'blue', money: 3}
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

const everyTurnReducers = [
  claimCities,
  claimIncome
]

export function update (state: GameState, actions: Action[]): GameState {
  const updatedState = actions.reduce(applyAction, state);

  return everyTurnReducers.reduce((state, reducer) => reducer(state), updatedState);
}

function add (a: Position, b: Position): Position {
  return {
    row: a.row + b.row,
    column: a.column + b.column
  }
}

type BattleResult = {
  livingAllied: Unit[];
  dead: Set<Unit>;
}

const DEFENDER_ADVANTAGE = 1;

function battle (movingTroops: Unit[], enemyTroops: Unit[]): BattleResult {
  const alliedCount = movingTroops.length;
  const enemyCount = enemyTroops.length;

  let enemyStrength = DEFENDER_ADVANTAGE + enemyCount;
  const dead = new Set<Unit>();

  while (enemyStrength > 0 && movingTroops.length > 0) {
    dead.add(movingTroops.pop() as Unit);
    dead.add(enemyTroops.pop() as Unit);

    enemyStrength -= 1;
  }

  return {
    livingAllied: movingTroops,
    dead
  }
}

const reducers = {
  move (state: GameState, moveAction: Action): GameState {
    const action = moveAction as MoveAction;
    const possibleSoldiersToMove = state.units.filter((unit: Unit) =>
      unit.ownerId === action.playerId && samePosition(unit.position, action.from)
    );

    const tileToMoveTo = add(action.from, action.direction);

    const enemies = state.units.filter(unit => unit.ownerId !== action.playerId && samePosition(unit.position, tileToMoveTo));

    let movingTroops = possibleSoldiersToMove.slice(0, action.numberOfTroops);

    if (enemies.length > 0) {
      const battleResults = battle(movingTroops, enemies);

      state.units = state.units.filter(unit => !battleResults.dead.has(unit));

      movingTroops = battleResults.livingAllied;
    }

    movingTroops.forEach((unit: Unit) => {
      unit.position = add(unit.position, action.direction);
    });

    return state;
  },

  purchase (state: GameState, purchaseAction: Action): GameState {
    const action = purchaseAction as PurchaseAction;
    const playerId = action.playerId;
    const player = state.players.find(player => player.id === playerId) as PlayerState;
    const base = (state.settlements.find(settlement => settlement.ownerId === playerId && settlement.type === 'base') as Settlement);
    let quantity = action.quantity;

    while (quantity > 0) {
      state.units.push({
        type: 'soldier',
        ownerId: playerId,
        position: {...base.position}
      });

      player.money -= action.cost;

      quantity--;
    }

    return state;
  }
}

function claimCities (state: GameState): GameState {
  const settlements = state.settlements.map(settlement => {
    const troopsInSettlement = state.units.filter((unit: Unit) => samePosition(unit.position, settlement.position));

    let maxTroops = 0;
    let playerWithMostTroops = null;

    state.players.forEach((player: PlayerState) => {
      const troopCount = troopsInSettlement.filter(troop => troop.ownerId === player.id).length;

      if (troopCount > maxTroops) {
        playerWithMostTroops = player.id;
        maxTroops = troopCount;
      }
    });

    if (playerWithMostTroops) {
      settlement.ownerId = playerWithMostTroops;
    }

    return settlement;
  });

  return {
    ...state,

    settlements
  }
}

function settlementIncome (settlement: Settlement): number {
  if (settlement.type === 'base') {
    return 3;
  }

  if (settlement.type === 'city') {
    return 2;
  }

  if (settlement.type === 'village') {
    return 1;
  }

  throw new Error(`strange settlement type: ${settlement.type}`);
}

function claimIncome (state: GameState): GameState {
  const players = state.players.map(player => {
    const income : number = state.settlements
      .filter(settlement => settlement.ownerId === player.id)
      .map(settlementIncome)
      .reduce((acc, val) => acc + val, 0);

      return {
        ...player,

        money: player.money + income
      }
  });

  return {
    ...state,

    players
  }
}

export function samePosition (a: Position, b: Position): boolean {
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
