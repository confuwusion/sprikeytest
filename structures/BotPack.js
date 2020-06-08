const { ActionsManager } = require("./ActionsManager.js");
const { Collection } = require("discord.js");
const { Mee6API } = require("./Mee6API.js");
const { TimeManager } = require("./TimeManager.js");

class BotPack {
  constructor(cache, client, MAIN_GUILD, TEST_GUILD) {
    this.botPack = this;
    
    this.cache = cache;
    this.client = client;
    
    this.MAIN_GUILD = MAIN_GUILD;
    this.TEST_GUILD = TEST_GUILD;
    
    this.categories = new Collection();
    this.commands = new Collection();
    this.levels = new Mee6API(MAIN_GUILD || TEST_GUILD);
    this.botActions = new ActionsManager(this);
    this.timeManager = new TimeManager(this, {});
    this.eventState = false;
  }
  
  
}

module.exports = { BotPack };