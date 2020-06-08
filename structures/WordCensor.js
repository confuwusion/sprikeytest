const { CacheMap } = require("./CacheMap.js");
const { WatcherData } = require("./Watcher.js");

const CENSOR_BYPASS = "[^a-zA-Z]*?";
const typeRegistries = {
  censor: [
    { actionName: "log", actionCode: 1 },
    { actionName: "delete", actionCode: 2 },
    { actionName: "warn", actionCode: 3 }
  ],
  watch: [
    { actionName: "log", actionCode: 9 }
  ]
};

class CensorWatcherData extends WatcherData {
  constructor(censorWord, pattern, actionRegistries) {
    super({
      pattern, actionRegistries,
      criteria: {
        channelIDs: [],
        channelType: false
      },
      replaceOptions: { censorWord },
      cleanConfusables: true
    });
  }
}

class CensorWordData {
  constructor(censorID, censorWord, censorType, synonyms) {
    this.censorID = censorID;
    this.censorWord = censorWord;
    this.censorType = censorType;
    this.synonyms = synonyms || [];
  }
}

class WordCensor extends CacheMap {
  constructor(data, cache) {
    super(data, cache);
  }
  
  createCensor(censorWord, censorType) {
    const censorPattern = this.createPattern([censorWord]);
    const censorWordData = new CensorWatcherData(censorWord, censorPattern, typeRegistries[censorType]);
 
    const censorID = this.cache.watchPatterns.register(censorWordData);
    const censorData = new CensorWordData(censorID, censorWord, censorType);
    return this.set(censorWord, censorData);
  }
  
  // Create a source string formatted for watcher testing
  formatSource(source) {
    const charDict = this.cache.characterDictionary;
    
    const formattedSource = source.split("")
      .map(char => `(?:${char}${
        /\w/.test(char) && charDict.has(char)
          ? `|${charDict.get(char).join("|")}`
          : ""
      })+`)
      .join(CENSOR_BYPASS);
    
    return formattedSource;
  }
  
  // Create pattern according to its word and synonyms
  createPattern(sources) {
    const classThis = this;
    const formattedSources = `(?<![a-zA-Z])(?:${sources.map(classThis.formatSource.bind(classThis)).join("|")})(?![a-zA-Z])`;
    
    return [ formattedSources, "i" ];
  }
  
  rebaseCensor(censorWord) {
    const { censorID, synonyms } = this.get(censorWord);
    const rebasedPattern = this.createPattern([ censorWord, ...synonyms ]);
    
    const watcherData = this.cache.watchPatterns.get(censorID);
    this.cache.watchPatterns.edit(censorID, {
      ...watcherData,
      pattern: rebasedPattern
    });
    
    return true;
  }
}

module.exports = { CensorWordData, WordCensor };