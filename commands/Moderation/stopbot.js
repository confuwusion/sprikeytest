module.exports = {
  description: "Stop the bot from responding",
  icon: {
    emoji: "🛑",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/248/stop-sign_1f6d1.png"
  },
  args: {
    usage: [{
      title: "Stop the bot from responding",
      parameters: [
        "yes"
      ]
    }],
    detectors: [
      /^yes/i
    ]
  },
  parse,
  run
}

async function run({ botPack, messageSuccess }, { categoryName, category }) {
  botPack.eventState = false;
  
  return messageSuccess("The bot will now stop listening to Discord events!");
}

function parse({ messageError }, [ confirmation ]) {
  if (confirmation.toLowerCase() !== "yes") return messageError("You have to confirm whether you want to use this command!");
  
  return {};
}