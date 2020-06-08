const argError = require("../methods/argError.js")("Log");
const { replacer } = require("../methods/actionMessage.js");

module.exports = {
  description: "Sends a log message to a log channel",
  usage: "<[Title]>;[Log Type];<[Log Message]>;[Show Content? (true OR false)]",
  perform,
  parse
};
  
function perform({ cache, channels, message }, [ logType, logTitle, logMessage, showContent ], replaceOptions) {
  const channel = channels.resolve(cache.logChannels.get(logType));
  if (!channel) return false;
  
  const fields = [];
  if (showContent) fields.push({
      name: "Message Content",
      value: message.content
    });
  
  return channel.send({embed:{
    title: logTitle || `${logType[0].toUpperCase()}${logType.slice(1)} Log`,
    description: `${replacer(message, logMessage, replaceOptions)}\n<:redirect:688363495552450634> [Jump to Message](${message.url})`,
    timestamp: Date.now(),
    fields
  }});
}

function parse([ logType, logTitle, logMessage, showContentStr = "false" ]) {
  if (!logTitle) return argError("You did not provide the Log Title!");
  if (!logType) return argError("You did not provide the Log Type!");
  if (!logMessage) return argError("You did not provide the Log Message!");
  
  const showContent = ({ true: true, false: false})[showContentStr.toLowerCase()];
  
  return [ logType, logTitle, logMessage, showContent ];
}