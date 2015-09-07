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
      x: 50,
      y: 0,
      new: true
    };

    players[name] = player;

    console.log('current players: ', players);
    socket.broadcast.emit('update', players);

    player.new = false;
  });

  socket.on('command', function (command, ...args) {
    console.log(command, ...args);

    commands[command](players, player, ...args)

    socket.broadcast.emit('update', players);
  });
});

http.listen(3000, function () {
  console.log('listening on *:3000');
});
