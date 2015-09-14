const getId = (function () {
  let count = 0;

  return () => {
    count += 1;

    return count;
  };
}());

module.exports = getId;
