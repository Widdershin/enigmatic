
module.exports = {
  move (deltaTime, action, unit, unitSprite) {
    const speed = 0.1 * deltaTime;
    const angleInDegrees = Math.atan2(
      action.position.x - unit.position.x,
      action.position.y - unit.position.y
    ) * 180 / Math.PI;

    const newPosition = {
      x: unit.position.x + Math.cos(angleInDegrees) * speed,
      y: unit.position.y - Math.sin(angleInDegrees) * speed
    }

    unit.position = newPosition;
    unitSprite.x = newPosition.x;
    unitSprite.y = newPosition.y;
  }
}
