function distance (a, b) {
  const distanceVector = {
    x: Math.abs(a.x - b.x),
    y: Math.abs(a.y - b.y)
  };

  return Math.sqrt(
    Math.pow(2, distanceVector.x),
    Math.pow(2, distanceVector.y)
  );
}

module.exports = {
  move (deltaTime, action, unit) {
    const speed = 0.1 * deltaTime;

    const angleInDegrees = Math.atan2(
      action.position.x - unit.position.x,
      action.position.y - unit.position.y
    ) * 180 / Math.PI;

    unit.position = {
      x: unit.position.x + Math.cos(angleInDegrees) * speed,
      y: unit.position.y - Math.sin(angleInDegrees) * speed
    };

    return distance(action.position, unit.position) < 50;
  }
};
