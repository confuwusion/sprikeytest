const argError = require("../methods/argError.js")("Notify");
const { replacer } = require("../methods/actionMessage.js");

const {
  CHANNELS: { MOD_MAIN, D_MOD_MAIN }
} = require("../constants.js");

module.exports = {
  description: "Sends a notification in the mod channel",
  usage: "<[Notification Message]>;",
  perform,
  parse
};

function perform(
  { MAIN_GUILD, TEST_GUILD, message },
  [notifMessage],
  replacerOptions
) {
  // Mod Channel here
  const channels = [
    MAIN_GUILD && MAIN_GUILD.channels.cache.get(MOD_MAIN),
    TEST_GUILD && TEST_GUILD.channels.cache.get(D_MOD_MAIN)
  ].filter(Boolean);

  return Promise.all(
    channels.map(channel =>
      channel.send({
        embed: {
          title: "Mod Notification",
          description: `${replacer(
            message,
            notifMessage,
            replacerOptions
          )}\n<:redirect:688363495552450634> [Jump to Message](${message.url})`,
          timestamp: Date.now()
        }
      })
    )
  );
}

function parse([notifMessage]) {
  if (!notifMessage)
    return argError("You have not provided a Notification message!");
  return [notifMessage];
}
