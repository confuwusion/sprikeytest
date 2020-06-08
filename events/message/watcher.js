const { MessageDataPack } = require("../../structures/DataPack.js");

module.exports = async function({ botActions, cache, pack }, rawMessage) {
  const message = rawMessage.partial ? await rawMessage.fetch() : rawMessage;
  
  if (message.author.bot) return;
  
  const prefix = process.env.PREFIX;
  if ([ `${prefix}watch`, `${prefix}censor`, `${prefix}synonym` ].includes(message.content.split(" ")[0])) {
    const { baseHierarchy } = cache.memberPermissions.getOrMake(message.author.id);
    if (baseHierarchy < 5) return;
  }

  const dataPack = new MessageDataPack(pack, message);
  const matches = cache.watchPatterns.matches(dataPack);
  
  for (const [, { actionRegistries, replaceOptions }] of matches) {
    
    for (const { actionName, actionCode } of actionRegistries) {
      botActions.emit(actionName, actionCode, message, replaceOptions);
    }
    
  }
};
