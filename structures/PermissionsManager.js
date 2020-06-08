const { CacheMap } = require("./CacheMap.js");
const {
  PERMISSIONS: {
    HIERARCHIES: { MASTER, EVERYONE }, 
    TRENDS: { CURRENT_BELOW, CURRENT_ONLY, CURRENT_ABOVE, TREND_OFFSET }
  }
} = require(`../constants.js`);

const trendComparison = [
  (a, b) => a >= b,
  (a, b) => a === b,
  (a, b) => a <= b
];

class PermissionsManager extends CacheMap {
  constructor(data, cache) {
    super(data, cache);
  }
  
  getOrMake(id, permissions = {}) {
    const data = this.get(id);
    
    if (!data) this.set(id, { baseHierarchy: EVERYONE, commandHierarchies: {} });
    
    return this.get(id);
  }
  
  forCommand(commandName, memberID) {
    const { baseHierarchy, commandHierarchies } = this.getOrMake(memberID);
    
    const commandHierarchy = commandHierarchies[commandName];
      
    return baseHierarchy === MASTER
      ? MASTER
      : commandHierarchy || baseHierarchy || EVERYONE;
  }
  
  compare(baseID, trend, comparingID) {
    const comparer = trendComparison[trend - TREND_OFFSET];
    
    return comparingID === 1 || comparer(comparingID, baseID);
  }
  
  hasLowerHierarchy(targetMemberID, comparingMemberID, commandName) {
    const targetHierarchy = this.forCommand(commandName, targetMemberID);
    const comparingHierarchy = this.forCommand(commandName, comparingMemberID);
    
    return this.compare(targetHierarchy, CURRENT_BELOW, comparingHierarchy);
  }
}

module.exports = {PermissionsManager};