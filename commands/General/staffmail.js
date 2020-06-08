const {
  CHANNELS: { MOD_MAIN, D_MOD_MAIN }
} = require("../../constants.js");

module.exports = {
  description: "Send a message to the staff (works in DMs)",
  icon: {
    emoji: "📨",
    url:
      "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/247/incoming-envelope_1f4e8.png"
  },
  args: {
    usage: [
      {
        title: "Send a message to staff",
        parameters: ["[Message]"]
      }
    ],
    detectors: [/^.+/]
  },
  parse,
  run
};

async function run(
  { MAIN_GUILD, TEST_GUILD, channel, author, messageSuccess },
  { mailMessage }
) {
  const modChannels = [
    MAIN_GUILD && MAIN_GUILD.channels.cache.get(MOD_MAIN),
    TEST_GUILD && TEST_GUILD.channels.cache.get(D_MOD_MAIN)
  ].filter(Boolean);

  await Promise.all(
    modChannels.map(modChannel =>
      modChannel.send({
        embed: {
          author: {
            name: author.tag,
            icon_url: author.displayAvatarURL({ format: "png", dynamic: true })
          },
          description: mailMessage,
          color: 10526880
        }
      })
    )
  );

  return messageSuccess(
    "Successfully sent your message to the Communimate staff!"
  );
}

function parse({ client, categories, messageError }, [mailMessage]) {
  if (!mailMessage)
    return messageError(
      "You need to provide the message that you want to deliver!"
    );

  return { mailMessage };
}
