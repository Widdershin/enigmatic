import * as assert from 'assert';
import {makeGameState, toString, update, Action, GameState, Settlement, Unit} from '../src/game-state';

function stripWhitespace (str: string): string {
  const lines = str.split('\n').filter(line => line.trim() !== '');

  const minWhitespace = Math.min(...lines.map(line => {
    const whitespace = /^( +)/g;

    const match = line.match(whitespace);

    if (!match) return Infinity;


    return match[0].length;
  }));

  return lines.map(line => line.slice(minWhitespace)).join('\n');
}

function assertState (actualState: GameState, expectedState: string) {
  assert.equal(toString(actualState), stripWhitespace(expectedState));
}

describe('enigmatic', () => {
  const state = makeGameState();

  describe('game state', () => {
    it('has two players', () => {
      assert.equal(state.players.length, 2);
    });

    it('has two bases owned by the players', () => {
      state.players.forEach(player => {
        const base : Settlement | undefined = state.settlements.find((settlement: Settlement) =>
          settlement.type === 'base' && settlement.ownerId === player.id
        );

        assert(base, `Player ${player.id} has no base`);
      });
    });

    it('has two soldiers owned by each player', () => {
      state.players.forEach(player => {
        const soldiers = state.units.filter((unit: Unit) =>
          unit.type === 'soldier' && unit.ownerId === player.id
        );

        assert.equal(soldiers.length, 2, `Player ${player.id} has ${soldiers.length} soldiers, expected 2`);
      });
    });

    it('has one neutral city and two neutral villages', () => {
      const cities = state.settlements.filter(settlement => settlement.type === 'city' && settlement.ownerId === null);
      const villages = state.settlements.filter(settlement => settlement.type === 'village' && settlement.ownerId === null);

      assert.equal(cities.length, 1);
      assert.equal(villages.length, 2);
    });

    it('has a nice string representation', () => {
      assert.equal(toString(state), stripWhitespace(`
       ---------------------
       |   |   | r2|   |   |
       |   |   | # |   |   |
       ---------------------
       |   |   |   |   |   |
       |   |   |   |   |   |
       ---------------------
       |   |   |   |   |   |
       | ^ |   | @ |   | ^ |
       ---------------------
       |   |   |   |   |   |
       |   |   |   |   |   |
       ---------------------
       |   |   | b2|   |   |
       |   |   | # |   |   |
       ---------------------
      `));
    });
  });

  describe('performing actions', () => {
    it('allows moving troops', () => {
      const state = makeGameState();

      const actions : Action[] = [
        {
          type: 'move',
          numberOfTroops: 1,
          playerId: 'blue',
          from: {
            row: 4,
            column: 2
          },
          direction: {
            row: -1,
            column: 1
          }
        }
      ];

      const stateAfterActions = update(state, actions);

      assertState(stateAfterActions, `
       ---------------------
       |   |   | r2|   |   |
       |   |   | # |   |   |
       ---------------------
       |   |   |   |   |   |
       |   |   |   |   |   |
       ---------------------
       |   |   |   |   |   |
       | ^ |   | @ |   | ^ |
       ---------------------
       |   |   |   | b1|   |
       |   |   |   |   |   |
       ---------------------
       |   |   | b1|   |   |
       |   |   | # |   |   |
       ---------------------
      `);
    });

    it('allows moving multiple troops', () => {
      const actions : Action[] = [
        {
          type: 'move',
          numberOfTroops: 2,
          playerId: 'blue',
          from: {
            row: 4,
            column: 2
          },
          direction: {
            row: -1,
            column: 1
          }
        },
        {
          type: 'move',
          numberOfTroops: 2,
          playerId: 'red',
          from: {
            row: 0,
            column: 2
          },
          direction: {
            row: 1,
            column: 0
          }
        }
      ];

      const stateAfterActions = update(state, actions);

      assertState(stateAfterActions, `
       ---------------------
       |   |   | r |   |   |
       |   |   | # |   |   |
       ---------------------
       |   |   | r2|   |   |
       |   |   |   |   |   |
       ---------------------
       |   |   |   |   |   |
       | ^ |   | @ |   | ^ |
       ---------------------
       |   |   |   | b2|   |
       |   |   |   |   |   |
       ---------------------
       |   |   | b |   |   |
       |   |   | # |   |   |
       ---------------------
      `);
    });

    it('allows moving multiple troops', () => {
      const actions : Action[] = [
        {
          type: 'move',
          numberOfTroops: 2,
          playerId: 'blue',
          from: {
            row: 4,
            column: 2
          },
          direction: {
            row: -1,
            column: 1
          }
        },
        {
          type: 'move',
          numberOfTroops: 2,
          playerId: 'red',
          from: {
            row: 0,
            column: 2
          },
          direction: {
            row: 1,
            column: 0
          }
        }
      ];

      const nextActions : Action[] = [
        {
          type: 'move',
          numberOfTroops: 2,
          playerId: 'blue',
          from: {
            row: 3,
            column: 3
          },
          direction: {
            row: -1,
            column: 1
          }
        },
        {
          type: 'move',
          numberOfTroops: 2,
          playerId: 'red',
          from: {
            row: 1,
            column: 2
          },
          direction: {
            row: 1,
            column: 0
          }
        }
      ];

      const stateAfterActions = [actions, nextActions].reduce((state, actions) => update(state, actions), state);

      assertState(stateAfterActions, `
       ---------------------
       |   |   | r |   |   |
       |   |   | # |   |   |
       ---------------------
       |   |   |   |   |   |
       |   |   |   |   |   |
       ---------------------
       |   |   | r2|   | b2|
       | ^ |   | @ |   | ^ |
       ---------------------
       |   |   |   |   |   |
       |   |   |   |   |   |
       ---------------------
       |   |   | b |   |   |
       |   |   | # |   |   |
       ---------------------
      `);
    });

    it('allows purchasing troops', () => {
      const state = makeGameState();
      const actions : Action[] = [
        {
          type: 'purchase',
          playerId: 'blue',
          purchaseType: 'soldier',
          quantity: 2,
          cost: 1
        }
      ];

      const stateAfterActions = [actions].reduce((state, actions) => update(state, actions), state);

      assertState(stateAfterActions, `
       ---------------------
       |   |   | r2|   |   |
       |   |   | # |   |   |
       ---------------------
       |   |   |   |   |   |
       |   |   |   |   |   |
       ---------------------
       |   |   |   |   |   |
       | ^ |   | @ |   | ^ |
       ---------------------
       |   |   |   |   |   |
       |   |   |   |   |   |
       ---------------------
       |   |   | b4|   |   |
       |   |   | # |   |   |
       ---------------------
      `);
    });

    it('accumulates money for each player per turn', () => {
      const state = makeGameState();

      state.players.forEach(player => assert.equal(player.money, 3));

      const updatedState = update(state, []);

      updatedState.players.forEach(player => assert.equal(player.money, 6));
    });

    it('costs money to purchase things', () => {
      const state = makeGameState();

      state.players.forEach(player => assert.equal(player.money, 3));

      const updatedState = update(state, [
        {type: 'purchase', purchaseType: 'soldier', quantity: 3, cost: 1, playerId: 'blue'},
        {type: 'purchase', purchaseType: 'soldier', quantity: 3, cost: 1, playerId: 'red'}
      ]);

      updatedState.players.forEach(player => assert.equal(player.money, 3));
    });
  });

  describe('stripWhitespace', () => {
    it('strips leading whitespace', () => {
      assert.equal(stripWhitespace(`
                   a
                   b
                   c
                   `),
                   `a\nb\nc`);
    });
  });
});

