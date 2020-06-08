class Dictionary {
  constructor(pack) {
    Object.defineProperties(this, {
      pack: { value: pack },
      cache: { value: pack.cache }
    });
    
    this.nouns
    this.verbs
    this.adjectives
    this.adverbs
  }
}

module.exports = { Dictionary };