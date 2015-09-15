const getId = require('./get-id');
const Building = require('./buildings');

const commandCenterSpawnPoint = (function () {
  const spawnPoints = [
    { x: 500, y: 100 },
    { x: 900, y: 500 },
    { x: 500, y: 900 },
    { x: 100, y: 500 }
  ];

  let count = -1;

  return () => {
    count += 1;

    return spawnPoints[count % spawnPoints.length];
  };
}());

function startingBuildings (baseCenter) {
  return [
    Building('command-center', {position: baseCenter}),
    Building('extractor', {position: {x: baseCenter.x - 75, y: baseCenter.y - 30}})
  ];
}

function Player (name) {
  let newCommandCenterSpawnPoint = commandCenterSpawnPoint();

  return {
    name,
    buildings: startingBuildings(newCommandCenterSpawnPoint),

    units: [
      {
        id: getId(),
        type: 'worker',
        health: 50,
        position: {x: newCommandCenterSpawnPoint.x, y: newCommandCenterSpawnPoint.y + 40},
        incomingMessages: [],
        waypoints: [],
        possibleActions: [
          {command: 'build', buildingType: 'barracks', cost: 100, buildTime: 20000},
          {command: 'build', buildingType: 'extractor', cost: 80, buildTime: 15000}
        ]
      }
    ],

    commands: [],

    spaceBucks: 100,
    new: true
  };
}

module.exports = Player;

