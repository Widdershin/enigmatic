const Rx = require('rx');
const _ = require('lodash');

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const update = require('./src/update');
const getId = require('./src/get-id');
const Player = require('./src/player');

const TICK_RATE = 30;
let lastTime = 0;

const commands = {
  orderMove (players, player, unitId, newPosition) {
    units[unitId].incomingMessages.push({
      position: newPosition,
      action: 'move',
      timestamp: new Date().getTime(),
      origin: player.buildings[0].position
    });
  }
};

function updateState ({timestamp: currentTime}) {
  const deltaTime = currentTime - lastTime;

  update(players, deltaTime);

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
    player = Player(name);
    players[name] = player;

    units[player.units[0].id] = player.units[0];

    console.log('current players: ', players);
    io.emit('update', players);

    player.new = false;
  });

  socket.on('command', function (command, ...args) {
    console.log(command, ...args);

    commands[command](players, player, ...args);

    const now = new Date();

    player.commands.push({
      command,
      args,
      timestamp: new Date().getTime(),
      id: getId(),
      origin: player.buildings[0].position,
      humanReadable: `${_.padLeft(now.getHours(), 2, '0')}:${_.padLeft(now.getMinutes(), 2, '0')}:${_.padLeft(now.getSeconds(), 2, '0')} - MOVE 1 UNIT TO X: ${args[1].x}, Y: ${args[1].y}`
    });

    io.emit('update', players);
  });
});

app.use(express.static('static'));

app.get('/', function (req, res) {
  res.sendFile('index.html', { root: __dirname });
});

http.listen(3001, function () {
  console.log('listening on *:3001');
});
