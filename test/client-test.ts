import * as assert from 'assert';
import {mockDOMSource} from '@cycle/dom';
import {mockTimeSource} from '@cycle/time';
import dropRepeats from 'xstream/extra/dropRepeats';

import {Client} from '../src/client';
import {makeGameState} from '../src/game-state';


describe('Client', () => {
  it('exists', (done) => {
    const Time = mockTimeSource();
    const {diagram: d} = Time;

    const selectClickEvent = {currentTarget: {dataset: {row: '4', column: '2'}}};
    const moveClickEvent = {currentTarget: {dataset: {row: '3', column: '2'}}};
    const expectedMoveEvent = {
      type: 'move',

      from: {row: 4, column: 2},
      direction: {row: -1, column: 0},
      numberOfTroops: 1,
      playerId: 'blue'
    }

    const initialGameState = makeGameState();

    const cellClick$ = d(`---s---m---`, {s: selectClickEvent, m: moveClickEvent});
    const expected$  = d(`n------m---`, {n: [], m: [expectedMoveEvent]});
    const socket$    = d(`i----------`, {i: {type: 'updateGameState', playerId: 'blue', gameState: initialGameState}});

    const DOM = mockDOMSource({
      '.cell': {
        'click': cellClick$
      }
    });

    const Socket = socket$;

    const app = Client({Time, DOM, Socket});

    Time.assertEqual(
      app.localState$.map(state => state.actions).drop(1).compose(dropRepeats((a: any, b: any) => JSON.stringify(a) === JSON.stringify(b))),
      expected$
    );

    Time.run(done);
  });

  it('prevents invalid moves', (done) => {
    const Time = mockTimeSource();
    const {diagram: d} = Time;

    const selectClickEvent = {currentTarget: {dataset: {row: '4', column: '2'}}};
    const moveClickEvent = {currentTarget: {dataset: {row: '2', column: '1'}}};

    const initialGameState = makeGameState();

    const cellClick$ = d(`---s---m---`, {s: selectClickEvent, m: moveClickEvent});
    const expected$  = d(`n----------`, {n: []});
    const socket$    = d(`i----------`, {i: {type: 'updateGameState', playerId: 'blue', gameState: initialGameState}});

    const DOM = mockDOMSource({
      '.cell': {
        'click': cellClick$
      }
    });

    const Socket = socket$;

    const app = Client({Time, DOM, Socket});

    Time.assertEqual(
      app.localState$.map(state => state.actions).drop(1).compose(dropRepeats((a: any, b: any) => JSON.stringify(a) === JSON.stringify(b))),
      expected$
    );

    Time.run(done);
  });

  it('allows purchases', (done) => {
    const Time = mockTimeSource();
    const {diagram: d} = Time;

    const initialGameState = makeGameState();

    const soldierPurchase = {
      type: 'purchase',
      playerId: 'blue',
      purchaseType: 'soldier',
      cost: 1,
      quantity: 1
    }

    const twoSoldierPurchase = {
      type: 'purchase',
      playerId: 'blue',
      purchaseType: 'soldier',
      cost: 1,
      quantity: 2
    }

    const purchaseClick$ = d(`---x---x---`);
    const socket$        = d(`i----------`, {i: {type: 'updateGameState', playerId: 'blue', gameState: initialGameState}});
    const expected$      = d(`n--1---2---`, {n: [], 1: [soldierPurchase], 2: [twoSoldierPurchase]});

    const DOM = mockDOMSource({
      '.purchase.soldier': {
        'click': purchaseClick$
      }
    });

    const Socket = socket$;

    const app = Client({Time, DOM, Socket});

    Time.assertEqual(
      app.localState$.map(state => state.actions.filter(action => action.type === 'purchase')).drop(1).compose(dropRepeats((a: any, b: any) => JSON.stringify(a) === JSON.stringify(b))),
      expected$
    );

    Time.run(done);
  });
});
