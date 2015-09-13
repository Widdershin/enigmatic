module.exports = function waveRadius (command) {
  return (new Date().getTime() - command.timestamp) / 3;
};
