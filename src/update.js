const behaviours = require('../behaviour');
const _ = require('lodash');
const Circle = require('../node_modules/pixi.js/src/core/math/shapes/Circle.js');

const waveRadius = require('./calculate-wave-radius');

const EXTRACTOR_INCOME = 1 / 1000;

function positionInsideWave (position, command) {
  return new Circle(command.origin.x, command.origin.y, waveRadius(command))
    .contains(position.x, position.y);
}

function receivedCommands (commands, position) {
  return commands.filter(command => positionInsideWave(position, command));
}

function update (players, deltaTime, unitUpdateCallback) {
  _.values(players).forEach(player => {
    player.buildings.forEach(building => {
      const newlyReceivedCommands = receivedCommands(building.incomingMessages, building.position);

      building.incomingMessages.splice(0, newlyReceivedCommands.length);

      building.waypoints = building.waypoints.concat(newlyReceivedCommands);

      let currentAction = building.waypoints[0];

      if (currentAction === undefined) { return; }

      const done = behaviours[currentAction.action](player, deltaTime, currentAction, building);

      if (done) {
        building.waypoints.shift();
      }
    });

    player.units.forEach(unit => {
      const newlyReceivedCommands = receivedCommands(unit.incomingMessages, unit.position);

      unit.incomingMessages.splice(0, newlyReceivedCommands.length);

      unit.waypoints = unit.waypoints.concat(newlyReceivedCommands);

      let currentAction = unit.waypoints[0];

      if (currentAction === undefined) { return; }

      const done = behaviours[currentAction.action](player, deltaTime, currentAction, unit);

      if (done) {
        unit.waypoints.shift();
      }

      if (unitUpdateCallback) {
        unitUpdateCallback(unit);
      }
    });

    const otherPlayers = _.chain(players).values().reject({name: player.name}).value();

    const allCommands = _.chain(otherPlayers).map('commands').flatten().value();

    player.receivedMessages = receivedCommands(allCommands, player.buildings[0].position);

    player.spaceBucks += player.buildings
      .filter(building => building.type === 'extractor')
      .filter(building => building.complete)
      .length * deltaTime * EXTRACTOR_INCOME;
  });
}

module.exports = update;
