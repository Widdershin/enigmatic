/* globals describe, it */

const _ = require('lodash');
const assert = require('assert');

const Building = require('../src/buildings');
const Player = require('../src/player');
const behaviours = require('../behaviour');
const distance = require('../distance');

describe('train', () => {
  it('trains a unit', () => {
    const barracks = Building('barracks', {position: {x: 0, y: 0}});
    const player = Player('test');

    player.buildings.push(barracks);

    const action = {
      action: 'train',
      details: {
        command: 'train',
        unitType: 'marine',
        cost: 30,
        buildTime: 5000
      }
    };

    const deltaTime = 5005;
    behaviours.train(player, deltaTime, action, barracks);

    assert.equal(_.last(player.units).type, 'marine');
  });
});
