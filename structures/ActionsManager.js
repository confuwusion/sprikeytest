const { CacheMap } = require("./CacheMap.js");
const { MessageDataPack } = require("./DataPack.js");

class ActionsManager {
  constructor({ cache, botPack }) {
    this.actions = new CacheMap();
    this.pack = botPack;
    this.cache = cache;
  }
  
  get actionData() {
    return this.cache.actionData;
  }
  
  async emit(actionName, actionCode, message, replaceOptions) {
    const action = this.actions.get(actionName);
    const actionData = actionCode instanceof Array
      ? actionCode
      : this.actionData.get(actionCode).actionData;
    
    const dataPack = new MessageDataPack(this.pack, message);
    
    return action.perform(dataPack, actionData, replaceOptions);
  }
  
  parseAction({ actionName, actionData }) {
    const action = this.actions.get(actionName);
    const processedData = action.parse(actionData);
    
    return { actionName, processedData };
  }
  
  register({ actionName, processedData }) {
    const actionCode = this.actionData.add({
      actionName,
      actionData: processedData
    });
    
    return { actionName, actionCode };
  }
}

module.exports = { ActionsManager };