var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('static'));

app.get('/', function (req, res) {
  res.sendFile('index.html', { root: __dirname });
});

var players = {};

io.on('connection', function (socket) {
  var player = {};

  socket.on('disconnect', function () {
    console.log(player.name + ' disconnected');
    socket.broadcast.emit('player left', player.name);
    delete players[player.name];
  });

  socket.on('join game', function (name) {
    player = {
      name: name,
      x: 0,
      y: 0
    };

    console.info(name + ' joined game');

    console.log('current players: ', players);
    socket.emit('load', players);

    players[name] = player;

    socket.broadcast.emit('player joined', name);
  });

  socket.on('player move', function (x, y) {
    console.log(player.name + ' moved to ', {x: x, y: y});
    player.x = x;
    player.y = y;

    socket.broadcast.emit(
      'player move',
      player.name,
      player.x,
      player.y
    );
  });
});

http.listen(3000, function () {
  console.log('listening on *:3000');
});
