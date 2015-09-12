/* globals describe, it */

const distance = require('../distance');
const assert = require('assert');

describe('distance', () => {
  it('returns the distance between two points', () => {
    const calculatedDistance = distance(
      {x: 0, y: 0},
      {x: 15, y: 0}
    );

    assert.equal(calculatedDistance, 15);
  });
});
