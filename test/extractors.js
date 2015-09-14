/* globals describe, it */

const update = require('../src/update');
const Player = require('../src/Player');
const assert = require('assert');

describe('Player', () => {
  it('receives resources every update per extractor', () => {
    const player = Player('test');

    const players = {test: player};

    const oldSpaceBucksAmount = player.spaceBucks;

    update(players, 1000);

    assert.equal(player.spaceBucks, oldSpaceBucksAmount + 10);
  });
});

