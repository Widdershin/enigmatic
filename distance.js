module.exports = function distance (a, b) {
  const distanceVector = {
    x: Math.abs(a.x - b.x),
    y: Math.abs(a.y - b.y)
  };

  return Math.sqrt(
    Math.pow(distanceVector.x, 2) +
    Math.pow(distanceVector.y, 2)
  );
};

