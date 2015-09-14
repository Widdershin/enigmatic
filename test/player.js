/* globals describe, it */

const Player = require('../src/player');
const assert = require('assert');

describe('Player', () => {
  const player = Player('test');

  it('starts with 100 space bucks', () => {
    assert.equal(player.spaceBucks, 100);
  });

  it('has units and buildings', () => {
    assert.equal(player.units.length, 1);
    assert.equal(player.buildings.length, 2);
  });

  it('starts with an extractor', () => {
    assert.equal(player.buildings[1].type, 'extractor');
  });
});

