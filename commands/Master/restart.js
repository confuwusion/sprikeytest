module.exports = {
  description: "Restarts the bot",
  icon: {
    emoji: "🔁",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/236/clockwise-rightwards-and-leftwards-open-circle-arrows_1f501.png"
  },
  args: {
    blank: "to restart the bot"
  },
  run
};

async function run({ cache, TEST_GUILD, channel, message }) {
  cache.restartMessage = {
    channelID: channel.id,
    messageID: message.id
  };
  
  await Promise.all([
    message.react("710180000896253953"),
    cache.save("restartMessage")
  ]);
  
  return process.exit();
}