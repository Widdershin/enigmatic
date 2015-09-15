/* globals describe, it */

const update = require('../src/update');
const Player = require('../src/player');
const Building = require('../src/buildings');
const assert = require('assert');

describe('Player', () => {
  it('receives resources every update per complete extractor', () => {
    const player = Player('test');

    const players = {test: player};

    let oldSpaceBucksAmount = player.spaceBucks;

    update(players, 10000);

    assert.equal(player.spaceBucks, oldSpaceBucksAmount + 10);

    oldSpaceBucksAmount = player.spaceBucks;

    player.buildings.push(
      Building('extractor', {position: {x: 0, y: 0}, complete: false})
    );

    update(players, 10000);

    assert.equal(player.spaceBucks, oldSpaceBucksAmount + 10);
  });
});

