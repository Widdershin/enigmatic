const socket = window.socket;
const PIXI = require('pixi.js');
const $ = require('jquery');
const _ = require('lodash');
const Rx = require('rx');
require('rx-dom');

require('es6-shim');

const behaviours = require('./behaviour');

var renderer = new PIXI.WebGLRenderer(800, 600, {antialias: false});
PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;

// The renderer will create a canvas element for you that you can then insert into the DOM.
document.body.appendChild(renderer.view);

var camera = new PIXI.Container();

// You need to create a root container that will hold the scene you want to draw.
var stage = new PIXI.Container();

camera.addChild(stage);

const SCALE = 2;

camera.scale = new PIXI.Point(SCALE, SCALE);

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
  stage.position = {x: -cameraPosition.x, y: -cameraPosition.y};
}

function getMousePosition () {
  let screenPosition = renderer.plugins.interaction.mouse.global;

  return {
    x: cameraPosition.x + (screenPosition.x / SCALE),
    y: cameraPosition.y + (screenPosition.y / SCALE)
  };
}

Rx.DOM.fromEvent(document.body, 'mousedown')
  .filter(ev => ev.which === 3)
  .map(getMousePosition)
  .forEach(sendMoveCommand)

function sendMoveCommand (movePosition) {
  socket.emit('command', 'orderMove', selectedUnit.entity.id, movePosition)
};

window.moveCamera = moveCamera;

function getOrSetName () {
  if (localStorage.engimaticPlayerName !== undefined) {
    return localStorage.engimaticPlayerName;
  }

  const newName = prompt('name: ');

  localStorage.engimaticPlayerName = newName;

  return newName;
}

var players = {};

var name = getOrSetName();

socket.emit('join game', name);
socket.on('update', updateNetworkState);

function updateNetworkState (newPlayersState) {
  players = newPlayersState;
  const currentPlayer = players[name];

  if (currentPlayer === undefined) {
    console.warn("Received state update with current player state");
    return;
  }

  for (let player of _.values(players)) {
    renderBuildings(player.buildings);
    renderUnits(player.units);
  }

  if (currentPlayer.new) {
    focus(currentPlayer.buildings[0], buildingSprites[currentPlayer.buildings[0].id]);
  }
}

var buildingSprites = {};

function renderBuildings (buildings) {
  buildings.forEach(building => {
    let buildingSprite = buildingSprites[building.id];

    if (buildingSprite === undefined) {
      buildingSprite = buildingSprites[building.id] = new PIXI.Sprite(commandCenterTexture);

      buildingSprite.click = (interactionData) => {
        focus(building, buildingSprite);
      };

      buildingSprite.scale = new PIXI.Point(2, 2);

      buildingSprite.anchor = new PIXI.Point(0.5, 0.5);

      buildingSprite.interactive = true;

      stage.addChild(buildingSprite);
    }

    buildingSprite.x = building.position.x;
    buildingSprite.y = building.position.y;
  });
}

var commandRings = [];

function renderCommands (commands, center) {
  commands.forEach(command => {
    const commandRing = new PIXI.Graphics();
    commandRing.lineStyle(2, 0xFAFAFA);

    const scale = waveRadius(command);

    commandRing.drawCircle(center.x, center.y, scale);

    commandRings.push(commandRing);

    stage.addChild(commandRing);
  });
}

var selectionRing;
var selectedUnit;

function focus (entity, sprite) {
  let newCameraPosition = entity.position;

  selectedUnit = {entity, sprite};

  if (selectionRing !== undefined) {
    selectionRing.parent.removeChild(selectionRing);
    selectionRing.destroy();
  }

  selectionRing = renderSelectionRing(entity, sprite);

  sprite.addChild(selectionRing);

  moveCamera({x: newCameraPosition.x - 200, y: newCameraPosition.y - 100});
}

var unitSprites = {};

function renderUnits (units) {
  units.forEach(unit => {
    let unitSprite = unitSprites[unit.id];

    if (unitSprite === undefined) {
      unitSprite = unitSprites[unit.id] = new PIXI.Sprite(bunnyTexture);
      unitSprite.interactive = true;
      unitSprite.anchor = new PIXI.Point(0.5, 0.5);

      unitSprite.click = (interactionData) => {
        focus(unit, unitSprite);
      };

      stage.addChild(unitSprite);
    }

    unitSprite.x = unit.position.x;
    unitSprite.y = unit.position.y;
  });
}

function renderCommandBar () {
  const commandBar = new PIXI.Graphics();

  commandBar.beginFill(0x2f2c47, 1);
  commandBar.lineStyle(3, 0x000000);
  commandBar.drawRect(0, 220, 400, 100);

  return commandBar;
}

function renderSelectionRing (entity, sprite) {
  const selectionRing = new PIXI.Graphics();

  selectionRing.lineStyle(3, 0x99e550);
  selectionRing.drawCircle(0, 0, sprite.height / 1.7);

  return selectionRing;
}
// kick off the animation loop (defined below)
registerInput();
animate(0);

let lastTime = 0;

function animate (currentTime) {
  let deltaTime = currentTime - lastTime;
  // start the timer for the next animation loop
  requestAnimationFrame(animate);

  update(deltaTime);

  commandRings.forEach(ring => {
    ring.parent.removeChild(ring);
    ring.destroy();
  });

  commandRings = [];

  _.values(players).forEach(player => renderCommands(player.commands, player.buildings[0].position));

  // this is the main render call that makes pixi draw your container and its children.
  renderer.render(camera);
  lastTime = currentTime;
}

function waveRadius (command) {
  return (new Date().getTime() - command.timestamp) / 3;
}

function buildingInsideWave (building, command) {
  return new PIXI.Circle(command.origin.x, command.origin.y, waveRadius(command))
    .contains(building.position.x, building.position.y);
}

function receivedCommands (commands, building) {
  return commands.filter(command => buildingInsideWave(building, command));
}

function update (deltaTime) {
  const player = players[name];
  const otherPlayers = _.chain(players).values().reject({name}).value();

  _.chain(players).values().map('units').flatten().value().forEach(unit => {
    let currentAction = unit.waypoints[0];

    if (currentAction === undefined) { return; }

    const done = behaviours[currentAction.action](deltaTime, currentAction, unit);

    if (done) {
      unit.waypoints.shift();
    }

    unitSprites[unit.id].x = unit.position.x;
    unitSprites[unit.id].y = unit.position.y;
  });

  if (player) {
    updateInterceptLog(player.buildings[0], otherPlayers);
  }
}

var interceptText = new PIXI.Text('No messages intercepted yet', {
  font: '12px VT323',
  fill: '#fffccc'
});

interceptText.position = new PIXI.Point(5, 220);

commandBar.addChild(interceptText);

function updateInterceptLog (headquarters, enemies) {
  const receivedMessages = receivedCommands(
    _.flatten(enemies.map(enemy => enemy.commands)),
    headquarters
  );

  interceptText.text = _.takeRight(receivedMessages, 5)
    .map(message => message.humanReadable).join('\n');
}

function registerInput () {
  const KEYS = {
    W: 119,
    S: 115,
    A: 97,
    D: 100
  };

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
