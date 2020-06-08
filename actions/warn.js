const argError = require("../methods/argError.js")("Notify");
const { replacer } = require("../methods/actionMessage.js");

module.exports = {
  description: "Sends a warn message, targeting trigger member, to the channel",
  usage: "<[Warn Message]>",
  perform,
  parse
};
  
function perform({ channel, message }, [ warnMessage ], replacerOptions) {
  return channel.send({
    embed: {
      author: {
        name: message.author.tag,
        icon_url: message.author.displayAvatarURL({ format: "png" })
      },
      title: "Message Censor",
      description: `${replacer(message, warnMessage, replacerOptions)}`,
      color: 16763981
    }
  });
}

function parse([ warnMessage = "You can't do that here!" ]) {
  if (!warnMessage) return argError("You have not provided a Notification message!");
  return [ warnMessage ];
}