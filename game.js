const socket = window.socket;
const PIXI = require('pixi.js');
const $ = require('jquery');
const _ = require('lodash');

require('es6-shim');

var renderer = new PIXI.WebGLRenderer(800, 600, null, false, false);

// The renderer will create a canvas element for you that you can then insert into the DOM.
document.body.appendChild(renderer.view);

// You need to create a root container that will hold the scene you want to draw.
var stage = new PIXI.Container();

// This creates a texture from a 'bunny.png' image.
var bunnyTexture = PIXI.Texture.fromImage('sprites/bunny.png');
var commandCenterTexture = PIXI.Texture.fromImage('sprites/command-center.png');

var backgroundTexture = PIXI.Texture.fromImage('sprites/ground.png');

var background = new PIXI.TilingSprite(backgroundTexture, 2000, 2000);

stage.addChild(background);


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

var name = getOrSetName();

socket.emit('join game', name);
socket.on('update', updateNetworkState);

function updateNetworkState (newPlayersState) {
  players = newPlayersState;
  const currentPlayer = players[name];

  if (currentPlayer.new) {
    cameraPosition = currentPlayer.buildings[0].position;
  }

  for (let player of _.values(players)) {
    renderBuildings(player.buildings);
    renderUnits(player.units);
  }
}

var buildingSprites = {};

function renderBuildings (buildings) {
  buildings.forEach(building => {
    let buildingSprite = buildingSprites[building.id];

    if (buildingSprite === undefined) {
      buildingSprite = buildingSprites[building.id] = new PIXI.Sprite(commandCenterTexture);

      stage.addChild(buildingSprite);
    }

    buildingSprite.x = building.position.x;
    buildingSprite.y = building.position.y;
  });
}

var unitSprites = {};

function renderUnits (units) {
  units.forEach(unit => {
    let unitSprite = unitSprites[unit.id];

    if (unitSprite === undefined) {
      unitSprite = unitSprites[unit.id] = new PIXI.Sprite(bunnyTexture);

      stage.addChild(unitSprite);
    }

    unitSprite.x = unit.position.x;
    unitSprite.y = unit.position.y;
  });
}

// kick off the animation loop (defined below)
registerInput();
animate();

function animate () {
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
  S: 119,
  W: 115,
  D: 97,
  A: 100
};

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
