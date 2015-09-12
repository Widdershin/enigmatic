const distance = require('./distance');

module.exports = {
  move (deltaTime, action, unit) {
    const speed = 0.1 * deltaTime;

    const angle = Math.atan2(
      action.position.y - unit.position.y,
      action.position.x - unit.position.x
    );

    unit.position = {
      x: unit.position.x + Math.cos(angle) * speed,
      y: unit.position.y + Math.sin(angle) * speed
    };

    return distance(action.position, unit.position) < 3;
  }
};
