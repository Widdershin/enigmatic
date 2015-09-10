var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

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

var players = {};

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
          position: {x: newCommandCenterSpawnPoint.x, y: newCommandCenterSpawnPoint.y + 40}
        }
      ]
    };

    players[name] = player;

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
