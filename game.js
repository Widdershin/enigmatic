const socket = window.socket;
const PIXI = require('pixi.js');
const $ = require('jquery');
const _ = require('lodash');
const Rx = require('rx');
require('rx-dom');

require('es6-shim');

const waveRadius = require('./src/calculate-wave-radius');
const update = require('./src/update');

var renderer = new PIXI.WebGLRenderer(800, 600, {antialias: false});
PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;

document.body.appendChild(renderer.view);

var camera = new PIXI.Container();
var stage = new PIXI.Container();

camera.addChild(stage);

const SCALE = 2;

camera.scale = new PIXI.Point(SCALE, SCALE);

const textures = {
  'command-center': PIXI.Texture.fromImage('sprites/command-center.png'),
  extractor: PIXI.Texture.fromImage('sprites/extractor.png'),
  bunny: PIXI.Texture.fromImage('sprites/bunny.png'),
  barracks: PIXI.Texture.fromImage('sprites/barracks.png'),
};

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
  .forEach(sendCommand);

function sendCommand (movePosition) {
  let command = 'orderMove';
  let action;

  if (buildingToBeBuilt) {
    command = 'build';
    action = buildingToBeBuilt.action;
    buildingToBeBuilt.sprite.parent.removeChild(buildingToBeBuilt.sprite);
    buildingToBeBuilt.sprite.destroy();
    buildingToBeBuilt = null;
  }

  socket.emit('command', command, selectedUnit.entity.id, movePosition, action);
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
      buildingSprite = buildingSprites[building.id] = new PIXI.Sprite(textures[building.type]);

      buildingSprite.click = (interactionData) => {
        focus(building, buildingSprite);
      };

      buildingSprite.scale = new PIXI.Point(2, 2);

      buildingSprite.anchor = new PIXI.Point(0.5, 0.5);

      buildingSprite.interactive = true;

      const buildingBar = new PIXI.Graphics();

      buildingSprite.addChild(buildingBar);
      buildingSprite.bar = buildingBar;

      buildingBar.beginFill(0x0F0F0F);

      const buildingInnerBar = new PIXI.Graphics();
      buildingInnerBar.anchor = new PIXI.Point(0, 0.5);

      let barWidth = 15;
      let barHeight = 3;

      buildingBar.drawRect(
        -barWidth / 2,
        -17,
        barWidth,
        barHeight
      );

      buildingBar.endFill();

      buildingBar.inner = buildingInnerBar;

      buildingInnerBar.beginFill(0xF0F0F0);

      buildingInnerBar.drawRect(
        -barWidth / 2,
        -17,
        barWidth,
        barHeight
      );

      buildingBar.endFill();

      buildingBar.addChild(buildingInnerBar);
      stage.addChild(buildingSprite);
    }

    const buildingBar = buildingSprite.bar;

    buildingSprite.x = building.position.x;
    buildingSprite.y = building.position.y;

    buildingBar.visible = !building.complete;
    if (!building.complete) {
      buildingBar.inner.scale = new PIXI.Point(building.progress / building.buildTime, 1);
    }
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

var unitSprites = {};

function renderUnits (units) {
  units.forEach(unit => {
    let unitSprite = unitSprites[unit.id];

    if (unitSprite === undefined) {
      unitSprite = unitSprites[unit.id] = new PIXI.Sprite(textures.bunny);
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

var selectionRing;
var selectedUnit;

function focus (entity, sprite) {
  let newCameraPosition = sprite.position;

  updateActionBar(entity.possibleActions || []);

  selectedUnit = {entity, sprite};

  if (selectionRing !== undefined) {
    selectionRing.parent.removeChild(selectionRing);
    selectionRing.destroy();
  }

  selectionRing = renderSelectionRing(entity, sprite);

  sprite.addChild(selectionRing);

  moveCamera({x: newCameraPosition.x - 200, y: newCameraPosition.y - 100});
}

// kick off the animation loop (defined below)
registerInput();
animate(0);

let lastTime = 0;

function animate (currentTime) {
  const player = players[name];
  let deltaTime = currentTime - lastTime;
  // start the timer for the next animation loop
  requestAnimationFrame(animate);

  update(players, deltaTime, (unit) => {
    unitSprites[unit.id].x = unit.position.x;
    unitSprites[unit.id].y = unit.position.y;
  });

  commandRings.forEach(ring => {
    ring.parent.removeChild(ring);
    ring.destroy();
  });

  commandRings = [];

  _.values(players).forEach(player => renderCommands(player.commands, player.buildings[0].position));

  if (player) {
    updateInterceptLog(player);
    updateResourcesText(player);
  }

  // this is the main render call that makes pixi draw your container and its children.
  renderer.render(camera);
  lastTime = currentTime;
}

var interceptText = new PIXI.Text('No messages intercepted yet', {
  font: '12px VT323',
  fill: '#fffccc'
});

interceptText.position = new PIXI.Point(5, 220);

commandBar.addChild(interceptText);

var resourcesText = new PIXI.Text('Bucks: $100', {
  font: '12px VT323',
  fill: '#FFF'
});

resourcesText.position = new PIXI.Point(5, 5);

camera.addChild(resourcesText);

function updateInterceptLog (player) {
  interceptText.text = _.takeRight(player.receivedMessages, 5)
    .map(message => message.humanReadable).join('\n');
}

function updateResourcesText (player) {
  resourcesText.text = `Spacebucks: $${player.spaceBucks.toFixed(0)}`;
}

var actionButtons = [];

var buildingToBeBuilt;

Rx.DOM.fromEvent(document.body, 'mousemove')
  .map(getMousePosition)
  .forEach(mousePosition => {
    if (buildingToBeBuilt) {
      buildingToBeBuilt.sprite.position = new PIXI.Point(mousePosition.x, mousePosition.y);
    }
  });

function updateActionBar (possibleActions) {
  actionButtons.forEach(button => {
    button.parent.removeChild(button);
    button.destroy();
  });

  actionButtons = [];

  possibleActions.forEach((action, index) => {
    const button = new PIXI.Text(`${action.command} ${action.buildingType} ($${action.cost})`, {
      font: '14px VT323',
      fill: '#FFF'
    });

    button.interactive = true;
    camera.addChild(button);

    button.position = new PIXI.Point(index * 130 + 5, 200);

    button.click = () => {
      buildingToBeBuilt = {
        sprite: new PIXI.Sprite(textures[action.buildingType]),
        action
      };

      buildingToBeBuilt.sprite.scale = new PIXI.Point(SCALE, SCALE);
      buildingToBeBuilt.sprite.anchor = new PIXI.Point(0.5, 0.5);
      buildingToBeBuilt.sprite.alpha = 0.7;

      stage.addChild(buildingToBeBuilt.sprite);
      buildingToBeBuilt.sprite.tint = 0xAAFFAA;
    };

    actionButtons.push(button);
  });
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
