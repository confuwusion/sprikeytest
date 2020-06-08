const { displayBigIntTime } = require("../methods/displayTime.js");

class Benchmark {
  constructor(start) {
    this.startTime = 0n;
    this.stopTime = 0n;
    this.timeTaken = 0n;
    
    if (start) this.start();
  }
  
  start() {
    return this.startTime = process.hrtime.bigint();
  }
  
  stop() {
    const stopTime = process.hrtime.bigint();
    this.timeTaken = stopTime - this.startTime;
    
    return this.stopTime = stopTime;
  }
  
  display() {
    return displayBigIntTime(this.timeTaken);
  }
}

module.exports = { Benchmark };