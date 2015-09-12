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

  it('returns the distance between two points diagonally', () => {
    const calculatedDistance = distance(
      {x: 0, y: 0},
      {x: 15, y: 15}
    );

    assert.equal(calculatedDistance.toFixed(2), 21.21);
  });

  it('returns 0 if the points are the same', () => {
    const calculatedDistance = distance(
      {x: 0, y: 0},
      {x: 0, y: 0}
    );

    assert.equal(calculatedDistance, 0);
  });
});
