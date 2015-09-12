
/* globals describe, it */

const behaviours = require('../behaviour');
const assert = require('assert');

describe('move', () => {
  it('moves a unit towards a point', () => {
    const unit = {
      position: {
        x: 0,
        y: 0
      }
    };

    const action = {
      position: {
        x: 50,
        y: 0
      }
    };

    const deltaTime = 100;
    behaviours.move(deltaTime, action, unit);

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

    const action = {
      position: {
        x: 0,
        y: 50
      }
    };

    const deltaTime = 100;
    behaviours.move(deltaTime, action, unit);

    assert.equal(unit.position.y, 10);
    assert.equal(unit.position.x.toFixed(2), 0);
  });
});
