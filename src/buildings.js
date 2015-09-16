const getId = require('./get-id');
const SECONDS = 1000; // a poor man's rails

const buildings = {
  'command-center': {
    health: 1000,
    buildTime: 30 * SECONDS
  },

  'extractor': {
    health: 600,
    buildTime: 15 * SECONDS
  },

  'barracks': {
    health: 800,
    buildTime: 20 * SECONDS,
    trainingProgress: 0,
    possibleActions: [
      {command: 'train', unitType: 'marine', cost: 30, buildTime: 5000}
    ]
  }
};

function Building (type, args) {
  const defaultArgs = {
    type,
    complete: true,
    id: getId(),
    waypoints: [],
    incomingMessages: []
  };

  return Object.assign({}, buildings[type], defaultArgs, args);
}

module.exports = Building;
