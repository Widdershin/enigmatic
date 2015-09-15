const _ = require('lodash');

const distance = require('./distance');
const getId = require('./src/get-id');

const Building = require('./src/buildings');

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
      return false;
    }

    let building = _.first(
      player.buildings.filter(building => distance(unit.position, building.position) < 3)
    );

    // TODO - set health
    if (building === undefined) {
      player.buildings.push(Building(action.details.buildingType, {
        position: unit.position,
        complete: false,
        progress: 0
      }));

      return false;
    }

    building.progress += deltaTime;

    if (building.progress >= action.details.buildTime) {
      building.complete = true;

      unit.waypoints.push({
        action: 'move',
        position: {x: action.position.x, y: action.position.y + 60}
      });
    }

    return building.complete;
  }
};
