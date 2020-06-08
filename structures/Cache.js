class Cache {
  constructor(client, database, loadCache) {
    Object.defineProperties(this, {
      client: {
        value: client,
        configurable: false,
        writable: false,
        readable: false
      },
      database: {
        value: database,
        configurable: false,
        writable: false,
        readable: false
      },
      pendingLoad: {
        value: Object.entries(loadCache),
        configurable: false,
        readable: false
      }
    });
  }

  async save(cacheItem) {
    const cacheEntry = this[cacheItem];
    
    return this.database.set(cacheItem, cacheEntry);
  }

  async load(cacheItem) {
    return this[cacheItem] = this.database.get(cacheItem);
  }

  async loadMissing() {
    const pending = [];
    const loaded = [];
    const errored = [];
    const cacheThis = this;

    for (const [cacheItem, { dataClass, generateDefaults }] of this.pendingLoad) {
      pending.push((async () => {
        const data = await cacheThis.database.get(cacheItem);
        
        const processedData = new dataClass(data, cacheThis);
        const preparedData = generateDefaults
          ? await generateDefaults(cacheThis, processedData)
          : processedData;
      
        this[cacheItem] = preparedData;
      
        loaded.push(cacheItem);
      })());
    }
    
    await Promise.all(pending);
    this.pendingLoad.splice(0);
    
    return loaded;
  }
}

module.exports = { Cache };