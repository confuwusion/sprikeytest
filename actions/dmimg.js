const argError = require("../methods/argError.js")("Log");
const { replacer } = require("../methods/actionMessage.js");

module.exports = {
  description: "Sends a log message to a log channel",
  usage: "<[Title]>;[Log Type];<[Log Message]>;[Show Content? (true OR false)]",
  perform,
  parse
};
  
async function perform({ cache, author, message }, [ imgURL, content = "" ], { gif }) {
  const channel = await author.createDM();
  if (!channel) return false;
  
  return channel.send({
    content,
    files: [
      replacer(message, imgURL, { gif: gif[~~(Math.random() * gif.length)] })
    ]
  });
}

function parse([ imgURL, content ]) {
  if (!imgURL) return argError("You did not provide the Image URL!");
  
  return [ imgURL, content ];
}