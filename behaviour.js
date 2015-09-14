const _ = require('lodash');

const distance = require('./distance');

function move (player, deltaTime, action, unit) {
  const speed = 0.1 * deltaTime;

  const angle = Math.atan2(
    action.position.y - unit.position.y,
    action.position.x - unit.position.x
  );

  unit.position = {
    x: unit.position.x + Math.cos(angle) * speed,
    y: unit.position.y + Math.sin(angle) * speed
  };

  return distance(action.position, unit.position) < 3;
}

module.exports = {
  move,

  build (player, deltaTime, action, unit) {
    if (distance(unit.position, action.position) > 2) {
      move(player, deltaTime, action, unit);
    }

    let building = _.first(
      player.buildings.filter(building => distance(unit.position, building.position) < 3)
    );

    // TODO - set health
    if (building === undefined) {
      player.buildings.push({
        type: action.buildingType,
        position: unit.position
      });
    }
  }
};
