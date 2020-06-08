class CacheMap extends Map {
  constructor(entries = [], cache) {
    super(entries);
    Object.defineProperty(this, "cache", {
      value: cache,
      enumerable: false,
      writeable: false,
      configurable: false
    });
  }
  
  map(callback) {
    return this.toArray.entries().map(callback);
  }
  
  get toArray() {
    const mapInstance = this;
    
    return {
      entries() {
        return Array.from(mapInstance.entries())
      },
      keys() {
        return Array.from(mapInstance.keys())
      },
      values() {
        return Array.from(mapInstance.values())
      }
    }
  }
}

module.exports = { CacheMap };