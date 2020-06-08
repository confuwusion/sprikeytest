function argError(action, err) {
  return new Error(`Action Argument Error [${action}]: ${err}`);
}

module.exports = function(action) {
  return argError.bind(argError, action);
}