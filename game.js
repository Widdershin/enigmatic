const socket = window.socket;
const PIXI = require('pixi.js');
const $ = require('jquery');
const _ = require('lodash');

require('es6-shim');

var renderer = new PIXI.WebGLRenderer(800, 600);

// The renderer will create a canvas element for you that you can then insert into the DOM.
document.body.appendChild(renderer.view);

// You need to create a root container that will hold the scene you want to draw.
var stage = new PIXI.Container();

// This creates a texture from a 'bunny.png' image.
var bunnyTexture = PIXI.Texture.fromImage('bunny.png');
var bunny = new PIXI.Sprite(bunnyTexture);

// Setup the position and scale of the bunny
bunny.position.x = 400;
bunny.position.y = 300;

bunny.scale.x = 2;
bunny.scale.y = 2;

// Add the bunny to the scene we are building.
stage.addChild(bunny);

var cameraPosition = {
  x: 0,
  y: 0
};

function getOrSetName () {
  if (localStorage.engimaticPlayerName !== undefined) {
    return localStorage.engimaticPlayerName;
  }

  const newName = prompt('name: ');

  localStorage.engimaticPlayerName = newName;

  return newName;
}

let players;

socket.emit('join game', getOrSetName());
socket.on('update', updateNetworkState);

let bunnies = {[getOrSetName()]: bunny};

function updateNetworkState (newPlayersState) {
  players = newPlayersState;
  console.log(players);
  for (let player of _.values(players)) {
    if (player.new) {
      let bunny = new PIXI.Sprite(bunnyTexture);

      bunnies[player.name] = bunny;

      bunny.scale.x = 2;
      bunny.scale.y = 2;

      stage.addChild(bunny);
    }

    bunnies[player.name].x = player.x;
    bunnies[player.name].y = player.y;
  }
}

// kick off the animation loop (defined below)
registerInput();
animate();

function animate() {
  // start the timer for the next animation loop
  requestAnimationFrame(animate);

  update();

  // this is the main render call that makes pixi draw your container and its children.
  renderer.render(stage);
}

function update () {
  stage.position = cameraPosition;
}

const KEYS = {
  W: 119,
  S: 115,
  A: 97,
  D: 100
}

function registerInput () {
  $(document).keypress(function (event) {
    const cameraSpeed = 5;

    if (event.which === KEYS.A) {
      cameraPosition.x -= cameraSpeed;
    }

    if (event.which === KEYS.D) {
      cameraPosition.x += cameraSpeed;
    }

    if (event.which === KEYS.W) {
      cameraPosition.y -= cameraSpeed;
    }

    if (event.which === KEYS.S) {
      cameraPosition.y += cameraSpeed;
    }
  });
}
