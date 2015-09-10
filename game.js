const socket = window.socket;
const PIXI = require('pixi.js');
const $ = require('jquery');
const _ = require('lodash');

require('es6-shim');

var renderer = new PIXI.WebGLRenderer(800, 600, {antialias: false});
PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;

// The renderer will create a canvas element for you that you can then insert into the DOM.
document.body.appendChild(renderer.view);

var camera = new PIXI.Container();

// You need to create a root container that will hold the scene you want to draw.
var stage = new PIXI.Container();

camera.addChild(stage);

camera.scale = new PIXI.Point(2, 2);

// This creates a texture from a 'bunny.png' image.
var bunnyTexture = PIXI.Texture.fromImage('sprites/bunny.png');
var commandCenterTexture = PIXI.Texture.fromImage('sprites/command-center.png');

var backgroundTexture = PIXI.Texture.fromImage('sprites/ground.png');

var background = new PIXI.TilingSprite(backgroundTexture, 2000, 2000);

stage.addChild(background);

const commandBar = renderCommandBar();

camera.addChild(commandBar);

var cameraPosition = {
  x: 0,
  y: 0
};

function moveCamera (newPosition) {
  cameraPosition = Object.assign(cameraPosition, newPosition);
  console.log('moving camera to', cameraPosition);
  stage.position = {x: -cameraPosition.x, y: -cameraPosition.y};
}

window.moveCamera = moveCamera;

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

  for (let player of _.values(players)) {
    renderBuildings(player.buildings);
    renderUnits(player.units);
  }

  if (currentPlayer.new) {
    focus(currentPlayer.buildings[0], currentPlayer.buildings[0].sprite);
  }
}

var buildingSprites = {};

function renderBuildings (buildings) {
  buildings.forEach(building => {
    let buildingSprite = buildingSprites[building.id];

    if (buildingSprite === undefined) {
      buildingSprite = buildingSprites[building.id] = new PIXI.Sprite(commandCenterTexture);

      buildingSprite.scale = new PIXI.Point(2, 2);

      buildingSprite.pivot = new PIXI.Point(0.5, 0.5);

      buildingSprite.interactive = true;

      stage.addChild(buildingSprite);
    }

    buildingSprite.x = building.position.x;
    buildingSprite.y = building.position.y;
  });
}

function focus (entity, sprite) {
  let newCameraPosition = entity.position;

  moveCamera({x: newCameraPosition.x - 200, y: newCameraPosition.y - 100});
}

var unitSprites = {};

function renderUnits (units) {
  units.forEach(unit => {
    let unitSprite = unitSprites[unit.id];

    if (unitSprite === undefined) {
      unitSprite = unitSprites[unit.id] = new PIXI.Sprite(bunnyTexture);
      unitSprite.interactive = true;

      unitSprite.click = (interactionData) => {
        focus(unit, unitSprite);
      }

      stage.addChild(unitSprite);
    }

    unitSprite.x = unit.position.x;
    unitSprite.y = unit.position.y;
  });
}

function renderCommandBar () {
  const commandBar = new PIXI.Graphics();

  commandBar.beginFill(0x222034, 1);
  commandBar.lineStyle(3, 0x000000);
  commandBar.drawRect(0, 220, 400, 100);

  return commandBar;
}
// kick off the animation loop (defined below)
registerInput();
animate();

function animate () {
  // start the timer for the next animation loop
  requestAnimationFrame(animate);

  update();

  // this is the main render call that makes pixi draw your container and its children.
  renderer.render(camera);
}

function update () {
}

const KEYS = {
  W: 119,
  S: 115,
  A: 97,
  D: 100
};

function registerInput () {
  $(document).keypress(function (event) {
    const cameraSpeed = 5;

    if (event.which === KEYS.A) {
      moveCamera({x: cameraPosition.x - cameraSpeed});
    }

    if (event.which === KEYS.D) {
      moveCamera({x: cameraPosition.x + cameraSpeed});
    }

    if (event.which === KEYS.W) {
      moveCamera({y: cameraPosition.y - cameraSpeed});
    }

    if (event.which === KEYS.S) {
      moveCamera({y: cameraPosition.y + cameraSpeed});
    }
  });
}
