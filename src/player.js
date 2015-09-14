const getId = require('./get-id');

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
    {id: getId(), type: 'command-center', health: 1000, position: baseCenter},
    {id: getId(), type: 'extractor', health: 600, position: {x: baseCenter.x - 75, y: baseCenter.y - 30}}
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
        waypoints: []
      }
    ],

    commands: [],

    spaceBucks: 100,
    new: true
  };
}

module.exports = Player;

