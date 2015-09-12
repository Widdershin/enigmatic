const Rx = require('rx');
const _ = require('lodash');

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const behaviours = require('./behaviour');

app.use(express.static('static'));

app.get('/', function (req, res) {
  res.sendFile('index.html', { root: __dirname });
});

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

const getId = (function () {
  let count = 0;

  return () => {
    count += 1;

    return count;
  };
}());

const commands = {
  orderMove (players, player, unitId, newPosition) {
    units[unitId].waypoints.push({
      position: newPosition,
      action: 'move'
    })
  }
};

const TICK_RATE = 30;

function update (deltaTime) {
  _.chain(players).values().map('units').flatten().value().forEach(unit => {
    let currentAction = unit.waypoints[0];

    if (currentAction === undefined) { return; }

    behaviours[currentAction.action](deltaTime, currentAction, unit, {x: 0, y: 0});
  });
}

let lastTime = 0;

function updateState ({timestamp: currentTime}) {
  const deltaTime = currentTime - lastTime;

  update(deltaTime);

  lastTime = currentTime;

  return players;
}

Rx.Observable.interval(1000 / TICK_RATE)
  .timestamp()
  .map(updateState)
  .filter(_ => Object.keys(players).length >= 1)
  .distinctUntilChanged(JSON.stringify)
  .forEach(state => io.emit('update', state));

var players = {};
var units = {};

io.on('connection', function (socket) {
  var player = {};

  socket.on('disconnect', function () {
    console.log(player.name + ' disconnected');
    socket.broadcast.emit('player left', player.name);
    delete players[player.name];
  });

  socket.on('join game', function (name) {
    let newCommandCenterSpawnPoint = commandCenterSpawnPoint();
    player = {
      name: name,
      buildings: [
        {id: getId(), type: 'command-center', health: 1000, position: newCommandCenterSpawnPoint}
      ],

      units: [
        {
          id: getId(),
          type: 'worker',
          health: 50,
          position: {x: newCommandCenterSpawnPoint.x, y: newCommandCenterSpawnPoint.y + 40},
          waypoints: []
        }
      ],
      new: true
    };

    players[name] = player;

    units[player.units[0].id] = player.units[0];

    console.log('current players: ', players);
    io.emit('update', players);

    player.new = false;
  });

  socket.on('command', function (command, ...args) {
    console.log(command, ...args);

    commands[command](players, player, ...args)

    io.emit('update', players);
  });
});

http.listen(3001, function () {
  console.log('listening on *:3001');
});
