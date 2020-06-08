class DataPack {
  constructor({
    cache, client, MAIN_GUILD, TEST_GUILD,
    categories, commands, botActions, timeManager, pauseEvents, botPack
  }) {
    this.cache = cache;
    this.client = client;
    
    this.MAIN_GUILD = MAIN_GUILD;
    this.TEST_GUILD = TEST_GUILD;
    
    // Client-based properties
    this.emojis = client.emojis;
    this.guilds = client.guilds;
    this.users = client.users;
    
    this.categories = categories;
    this.commands = commands;
    this.botActions = botActions;
    this.timeManager = timeManager;
    this.pauseEvents = pauseEvents;
    
    this.botPack = botPack;
    this.dataPack = this;
  }
  
  /*forMessage(message, command) {
    const msgDataPack = new MessageDataPack(this, message, command);
    const dataProto = Object.assign({}, this, DataPack.prototype, MessageDataPack.prototype)
    for (const [name, accessor] of Object.entries(Object.getOwnPropertyDescriptors(DataPack.prototype))) {
      if (name === "constructor") continue;
      Object.defineProperty(dataProto, name, accessor);
    }
    for (const [name, accessor] of Object.entries(Object.getOwnPropertyDescriptors(MessageDataPack.prototype))) {
      if (name === "constructor") continue;
      Object.defineProperty(dataProto, name, accessor);
    }
    
    return Object.assign(Object.create(dataProto), msgDataPack);
  }*/
  
  get pack() {
    return this;
  }
  
  async resolve(manager, resolvable) {
    const rawData = manager.resolve(resolvable);
    if (!rawData) return rawData;
    
    return rawData.partial
      ? rawData.fetch()
      : rawData;
  }
}

class MessageDataPack extends DataPack {
  constructor(pack, message, command) {
    // All Client based properties
    super(pack.botPack);
    
    const { guild } = message;
    // Guild based
    this.channels = guild && guild.channels;
    this.members = guild && guild.members;
    this.roles = guild && guild.roles;
    
    // Message Based
    this.message = message;
    this.content = message.content;
    this.author = message.author;
    this.channel = message.channel;
    this.guild = message.guild;
    this.member = message.member;
    this.reactions = message.reactions;
    
    this.command = command;
    this.error = null;
    this.warn = null;
    this.success = null;
    this.default = null;
    //this.messageError = MessageDataPack.prototype.messageError.bind(this);
  }
  
  get messageDefault() {
    return (function(message) {
      return (this.default = {
        embed: this.command.embedTemplate()
          .setDescription(message)
          .setColor(4691422)
      }).embed;
    }).bind(this);
  }
  
  get messageError() {
    return (function(message) {
      return (this.error = {
        embed: this.command.embedTemplate()
          .setDescription(`<:error:709510101760868435> ${message}`)
          .setColor(12864847)
      }).embed;
    }).bind(this);
  }
  
  get messageWarn() {
    return (function(message) {
      return (this.warn = {
        embed: this.command.embedTemplate()
          .setDescription(message)
          .setColor(16763981)
      }).embed
    }).bind(this);
  }
  
  get messageSuccess() {
    return (function(message) {
      return (this.success = {
        embed: this.command.embedTemplate()
          .setDescription(`<:success:709510035960496149> ${message}`)
          .setColor(4241788)
      }).embed;
    }).bind(this);
  }
}

module.exports = { DataPack, MessageDataPack };