const actions = {
  view,
  set
};

module.exports = {
  description: "Manage reaction roles",
  icon: {
    emoji: "🖲️",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/236/trackball_1f5b2.png"
  },
  args: {
    usage: [{
      title: "View active reaction roles",
      parameters: [
        "view"
      ]
    }, {
      title: "Setup a reaction role",
      parameters: [
        "set",
        "[Channel Tag]",
        "[Role ID]:[Emoji] (multiple separated by a space)",
        "(on second line onwards) [Description]"
      ]
    }, {
      title: "Stop a reaction role",
      description: "Delete the reaction role message"
    }],
    detectors: [
      /^set|view/i,
      /(?:<#)?\d+>?/,
      /\d+:(?:(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])|(?:<:[^\W]+:)?(\d+)>?)/g,
      /^.+/
    ]
  },
  run,
  parse
};

// Has access to ROLE, EMOJI, MEMBER
async function run(pack, { action, ...data }) {
  return actions[action](pack, data);
};

async function view({ cache, messages, messageDefault }) {
  const rrList = Array.from(cache.reactionRoles.entries()).map(([messageID, { channelID, reactionRoles }]) => {
    const rrTags = reactionRoles.map(({roleID, name}) => `${name} gives <@&${roleID}>`)
        .join(", ");
      
    return `[${messageID}](https://discordapp.com/channels/${process.env.GUILD_ID}/${channelID}/${messageID}/): ${rrTags}`;
  })
  .join("\n");
    
  return messageDefault(rrList || "*There are no active reaction roles*")
    .setTitle("Active Reaction Roles")
}

async function set({ cache, channel, messageDefault, messageSuccess, messageWarn, pack }, { description, messageChannel, reactionRoles }) {
  
  // Construct the message of the reacion role
  const messageContent = messageDefault(`${description}
  ${reactionRoles.reduce((text, [role, emoji]) => `${text}\nReact to ${emoji} for ${role}`, "")}`);
  messageContent.author.name = "Reaction Role";
  pack.default = null;
  
  const demoMessage = await channel.send(messageContent);
  const confirmationMessage = await channel.send("💬 **Please confirm the Reaction Role message before I set it up.** \n\nRelpy with `yes` if you are satisfied, otherwise reply with `no` to cancel the creaction of this reaction role.\n\nYou have 30 seconds till auto-cancellation.");
  
  // Listen for "yes" or "no" for 30 seconds
  return channel.awaitMessages(m => ["yes", "no"].includes(m.content.toLowerCase()), {
      max: 1,
      time: 30000,
      errors: ["time"]
    })
    // Set up the reaction role in the desired channel with its reactions
    .then(async messages => {
      if (messages.first().content.toLowerCase() === "no") return channel.send(messageWarn("Cancelled the creation of reaction role as per request."));
  
      // Create the rank role information message with details about reaction emojis and the role they give
      const sentMessage = await messageChannel.send(messageContent);
  
      // Add reactions as groups
      reactionRoles.map(([roleID, reactionRole]) => setTimeout(() => sentMessage.deleted || sentMessage.react(reactionRole), 1000));
      
      cache.reactionRoles.set(
        sentMessage.id,
        {
          channelID: messageChannel.id,
          reactionRoles: reactionRoles.map(([role, emoji]) => ({
            roleID: role.id,
            name: typeof emoji === "string" ?
              emoji : emoji.name
          }))
        }
      );
      
      return Promise.all([
        cache.save("reactionRoles"),
        messageSuccess("Successfully set up the reaction role system! Note that it might take some time to add the reactions.")
      ]);
    })
  
    // Cancel the reaction role creation
    .catch((...collected) => channel.send(messageWarn("Cancelled the creation of reaction role due to no response for 30 seconds.")));
}

async function parse({ client, channels, roles, emojis, messageError }, [ rawAction, channelTag, reactionRules, description ]) {
  // $reactRole channelID @roleID:emoji
  // <description>
  if (!rawAction) return messageError("You did not provide the action you want to perform in this command!");
  
  const action = rawAction.toLowerCase();
  if (action === "view") return { action };

  // REACTION ROLE CHANNEL
  const [, channelID] = channelTag.match(/(?:<#)?(\d+)>?/) || [];

  const messageChannel = channels.resolve(channelID);
  if (!messageChannel) return messageError(`The channel by ID \`${channelID}\` does not exist!`);

  // REACTION ROLE DESCRIPTION
  // Require description if options are provided
  if (!description) return messageError("You did not provide a descriptmdi for your Reaction Role!");
  
  const reactionRoles = [];
  console.log("Rules", reactionRules);
  for (const option of reactionRules) {
    console.log(option);

    const [, roleID, emojiStr, emojiID] = option.match(/(\d+):(?:(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])|(?:<:[^\W]+:)?(\d+)>?)/) || [];

    const reactionRole = [];

    const selectedRole = roles.resolve(roleID);
    if (!selectedRole) return messageError(`The role, for reaction role, by ID \`${selectedRole}\` does not exist!`);

    reactionRole.push(selectedRole);

    if (emojiID) {
      const emoji = await client.emojis.resolve(emojiID);

      if (!emoji) return messageError(`The emoji by ID \`${emojiID}\` does not exist!`);

      reactionRole.push(emoji);
    } else reactionRole.push(emojiStr);

    reactionRoles.push(reactionRole);
  }

  if (reactionRoles.length > 20) return messageError("You provided too many reactions per reation role message! The limit is 20");

  return { action, description, messageChannel, reactionRoles };
}