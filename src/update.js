const behaviours = require('../behaviour');
const _ = require('lodash');
const Circle = require('../node_modules/pixi.js/src/core/math/shapes/Circle.js');

const waveRadius = require('./calculate-wave-radius');

function buildingInsideWave (building, command) {
  return new Circle(command.origin.x, command.origin.y, waveRadius(command))
    .contains(building.position.x, building.position.y);
}

function receivedCommands (commands, building) {
  return commands.filter(command => buildingInsideWave(building, command));
}

function update (players, deltaTime, unitUpdateCallback) {
  _.chain(players).values().map('units').flatten().value().forEach(unit => {
    let currentAction = unit.waypoints[0];

    if (currentAction === undefined) { return; }

    const done = behaviours[currentAction.action](deltaTime, currentAction, unit);

    if (done) {
      unit.waypoints.shift();
    }

    if (unitUpdateCallback) {
      unitUpdateCallback(unit);
    }
  });

  _.values(players).forEach(player => {
    const otherPlayers = _.chain(players).values().reject({name: player.name}).value();

    const allCommands = _.chain(otherPlayers).map('commands').flatten().value();

    player.receivedMessages = receivedCommands(allCommands, player.buildings[0]);
  });
}

module.exports = update;
