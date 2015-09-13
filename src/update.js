const behaviours = require('../behaviour');
const _ = require('lodash');
const Circle = require('../node_modules/pixi.js/src/core/math/shapes/Circle.js');

const waveRadius = require('./calculate-wave-radius');

function positionInsideWave (position, command) {
  return new Circle(command.origin.x, command.origin.y, waveRadius(command))
    .contains(position.x, position.y);
}

function receivedCommands (commands, position) {
  return commands.filter(command => positionInsideWave(position, command));
}

function update (players, deltaTime, unitUpdateCallback) {
  _.chain(players).values().map('units').flatten().value().forEach(unit => {
    const newlyReceivedCommands = receivedCommands(unit.incomingMessages, unit.position);

    unit.incomingMessages.splice(0, newlyReceivedCommands.length);

    unit.waypoints = unit.waypoints.concat(newlyReceivedCommands);

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

    player.receivedMessages = receivedCommands(allCommands, player.buildings[0].position);
  });
}

module.exports = update;
