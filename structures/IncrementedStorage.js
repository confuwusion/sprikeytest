const { CacheMap } = require("./CacheMap.js");

class IncrementedStorage extends CacheMap {
  constructor(rawData = [], cache) {
    super(rawData, cache);
    
    if (!this.has("lastIndex")) this.set("lastIndex", 0);
  }
  
  allocate(givenIndex) {
    if (!isNaN(givenIndex) || givenIndex) {
      this.set(givenIndex);
      
      return givenIndex
    }
    
    const lastIndex = this.get("lastIndex") + 1;
    this.set("lastIndex", lastIndex);
    this.set(lastIndex);
    
    return lastIndex;
  }

  add(data) {
    const allocatedIndex = this.allocate();
    this.set(allocatedIndex, data);
    
    return allocatedIndex;
  }
  
  edit(id, data) {
    if (isNaN(id)) return NaN;
    this.set(id, data);
    
    return id;
  }

  remove(id) {
    if (isNaN(id)) return false;
    return this.delete(id);
  }

  arrayEntries() {
    return Array
      .from(this.entries())
      .filter(([key]) => key !== "lastIndex");
  }
  
  map(handler) {
    return this.arrayEntries().map(handler);
  }
}

module.exports = { IncrementedStorage };