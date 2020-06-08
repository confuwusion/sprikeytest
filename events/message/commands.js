const { MessageDataPack } = require("../../structures/DataPack.js");

module.exports = async function({ commands, pack }, rawMessage) {
  const message = rawMessage.partial ? await rawMessage.fetch() : rawMessage;

  if (message.author.bot || (!message.guild && !message.content.startsWith("$staffmail"))) return;

  // Message Type Detection.
  const messageContent = message.content.trim();
  if (messageContent.indexOf(process.env.PREFIX) !== 0) return;

  // Arguments Extraction
  const {
    groups: { commandName, commandArguments = "" }
  } = (messageContent.slice(1).match(/^(?<commandName>\w+|\$)(?:\s(?<commandArguments>[^]*))?$/) ||
    { groups: {} });
  if (!commandName) return;

  const command = commands.get(commandName.toLowerCase());
  if (!command) return;
  
  // Data Preparation
  const dataPack = new MessageDataPack(pack, message, command);
  
  // Permission Management
  const hasPermission = command.hasPermission(dataPack);
  if (!hasPermission) return;
  
  const extractedArgs = command.extractArgs(commandArguments);
  
  const parsedArgs = await command.parse(dataPack, extractedArgs);
  if (dataPack.error) return message.channel.send(dataPack.error);

  // Command Execution
  const commandOutput = await command.run(dataPack, parsedArgs);
  
  // Error Message Handling
  if (dataPack.error || dataPack.success || dataPack.default) return message.channel.send(dataPack.error || dataPack.success || dataPack.default || commandOutput);
};