class CacheArray extends Array {
  constructor(data, cache) {
    if (!isNaN(data)) return super(data);
    
    super();
    
    if (data[Symbol.iterator]) {
      this.push(...Array.from(data));
    } else this.push(data);
  }
}

module.exports = { CacheArray };