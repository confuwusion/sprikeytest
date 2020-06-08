const { ActionsManager } = require("./ActionsManager.js");
const { Client, Collection } = require("discord.js");
const { TimeManager } = require("./TimeManager.js");

class SprikeyClient extends Client {
  constructor(cache, MAIN_GUILD, TEST_GUILD) {
    super({
      partials: [
        "MESSAGE", 
        "REACTION",
        "GUILD_MEMBER",
        "USER"
      ],
      presence: {
        status: "idle",
        activity: {
          name: "Initiating bot..."
        }
      }
    });
    
    this.cache = cache;
    this.client = this;
    
    this.MAIN_GUILD = MAIN_GUILD;
    this.TEST_GUILD = TEST_GUILD;
    
    this.categories = new Collection();
    this.commands = new Collection();
    
    this.managers = {
      actions: new ActionsManager(this),
      censor: cache.wordCensor,
      permissions: cache.memberPermissions,
      time: new TimeManager(this, {}),
      watcher: cache.wordPatterns
    }
    
    this.eventState = false;
  }
  
  
}

module.exports = { SprikeyClient };