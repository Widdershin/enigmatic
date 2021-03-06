/* globals describe, it */

const _ = require('lodash');
const assert = require('assert');

const behaviours = require('../behaviour');
const distance = require('../distance');

describe('move', () => {
  it('moves a unit towards a point', () => {
    const unit = {
      position: {
        x: 0,
        y: 0
      }
    };

    const player = {
      units: [unit],
      buildings: []
    };

    const action = {
      position: {
        x: 50,
        y: 0
      }
    };

    const deltaTime = 100;
    behaviours.move(player, deltaTime, action, unit);

    assert.deepEqual(unit.position, {
      x: 10,
      y: 0
    });
  });

  it('moves a unit towards a point', () => {
    const unit = {
      position: {
        x: 0,
        y: 0
      }
    };

    const player = {
      units: [unit],
      buildings: []
    };

    const action = {
      position: {
        x: 0,
        y: 50
      }
    };

    const deltaTime = 100;
    behaviours.move(player, deltaTime, action, unit);

    assert.equal(unit.position.y, 10);
    assert.equal(unit.position.x.toFixed(2), 0);
  });
});

describe('build', () => {
  const unit = {
    position: {
      x: 0,
      y: 0
    },

    waypoints: []
  };

  const action = {
    position: {
      x: 0,
      y: 50
    },
    action: 'build',
    details: {buildingType: 'barracks', cost: 100, command: 'build', buildTime: 10000}
  };

  it('first moves to the build position', () => {
    const player = {
      units: [unit],
      buildings: []
    };

    _.times(30, () => behaviours.build(player, 30, action, unit));

    assert(distance(unit.position, action.position) < 5);
  });

  it('then builds a building', () => {
    const player = {
      units: [unit],
      buildings: []
    };

    _.times(30, () => behaviours.build(player, 30, action, unit));

    assert.equal(player.buildings.length, 1);
    assert.equal(player.buildings[0].type, action.details.buildingType);
    assert.equal(player.buildings[0].complete, false);

    let done = behaviours.build(player, action.details.buildTime + 10, action, unit);

    assert.equal(player.buildings[0].complete, true);

    behaviours.build(player, 1, action, unit);

    assert.equal(unit.waypoints[0].action, 'move');
  });
});
