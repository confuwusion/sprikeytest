const { remove: removeConfusables } = require("confusables");
const { IncrementedStorage } = require("./IncrementedStorage.js");

class WatcherData {
  constructor({
    pattern,
    criteria: {
      channelIDs = [],
      channelType = true,
      memberIDs = [],
      memberType = true,
      roleIDs = [],
      roleType = true
    },
    actionRegistries,
    cleanConfusables = false,
    replaceOptions = {}
  }) {
    this.pattern = pattern;
    this.criteria = {
      channelIDs,
      channelType,
      memberIDs,
      memberType,
      roleIDs,
      roleType
    }
    this.actionRegistries = actionRegistries;
    this.replaceOptions = replaceOptions;
    this.cleanConfusables = cleanConfusables;
  }
}

class Watcher extends IncrementedStorage {
  constructor(data, cache) {
    super(data, cache);
  }
  
  // Find all patterns that match with the message content and pattern criteria
  matches({ channel, content: rawContent,  member }) {
    return this.arrayEntries().filter(function([, {
      pattern,
      criteria: {
        channelIDs,
        channelType,
        memberIDs,
        memberType,
        roleIDs,
        roleType
      },
      cleanConfusables
    }]) {
      const patternRegExp = new RegExp(...pattern);
      const content = cleanConfusables
        ? removeConfusables(rawContent)
        : rawContent;
      
      if (!patternRegExp.test(content)) return false;
      
      if (channelIDs.length && channelIDs.includes(channel.id) !== channelType) return false;
      if (memberIDs.length && memberIDs.includes(member.id) !== memberType) return false;
      if (roleIDs.length && roleIDs.every(roleID => member.roles.cache.has(roleID)) !== roleType) return false;
      
      return true;
    });
  }
  
  // Register a pattern
  register(watcherData) {
    const watcher = new WatcherData(watcherData);
    
    return this.add(watcher);
  }
}

module.exports = { Watcher, WatcherData };