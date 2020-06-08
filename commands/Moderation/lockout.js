const actions = {
  view,
  remove,
  set
};

module.exports = {
  description: "Lockout a member",
  icon: {
    emoji: "🔐",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/236/closed-lock-with-key_1f510.png"
  },
  args: {
    usage: [{
      title: "Lockout a member from a channel",
      parameters: [
        "[Member ID/Mention]",
        "[Channel ID/Mention]"
      ]
    }],
    detectors: [
      /set|view|remove/i,
      /(?:<@)?(\d+)>?/,
      /(?:<#)?(\d+)>?/g
    ]
  },
  run,
  parse
};

async function run(pack, { action, ...data}) {
  return actions[action](pack, data);
}

async function view({ cache, messageDefault }, { memberID }) {
  if (!memberID) return messageDefault(Array.from(cache.lockout.entries())
      .filter(([, lockouts]) => lockouts.length)
      .map(([lockedMemberID]) => `<@${lockedMemberID}>`)
      .join(", ")
      || "*There are no locked out members*")
  
  const memberLockouts = (cache.lockout.get(memberID) || [])
    .map(channelID => `<#${channelID}>`)
    || [];
    
  return messageDefault(memberLockouts.length
      ? `<@${memberID}> is locked out of channel(s): ${memberLockouts.join(", ")}`
      : `<@${memberID}> is not locked out of any channel.`)
}

async function remove({ cache, messageSuccess }, { memberID, selectedChannels }) {
  const memberLockouts = cache.lockout.get(memberID);
  const channelIDs = selectedChannels.map(({ id }) => id);
  
  const filteredLockouts = memberLockouts.filter(channelID => !channelIDs.includes(channelID));
  
  await Promise.all(selectedChannels.map(async selectedChannel =>
    await selectedChannel.updateOverwrite(memberID, {
      SEND_MESSAGES: null
    })
  ));
  
  cache.lockout.set(memberID, filteredLockouts);
  
  return Promise.all([
    cache.save("lockout"),
    messageSuccess("Successfully unlocked member from the specified channels!")
  ]);
}

async function set({ cache, messageError, messageSuccess }, { memberID, targetMember, selectedChannels }) {
  const errors = [];
  const successes = [];
  
  await Promise.all(selectedChannels.map(async selectedChannel => {
    // Bot can't manage the channel
    if (!selectedChannel.manageable) return errors.push(`${selectedChannel.tag} (ID: \`${selectedChannel.id}\`): I do not have enough permissions to manage this channel!`);
    
    // Member is a mod
    if (targetMember.roles.cache.has(cache.modRole)) return messageError("Mod members cannot be locked out!");

    // Channel is not voice or text
    if (!["text", "voice"]) return errors.push(`${selectedChannel.tag} (ID: \`${selectedChannel.id}\`): The channel of type \`${selectedChannel.type}\` is not supported for blacklisting!`);
    
    // Setting the overwrite to mute the member
    await selectedChannel.createOverwrite(memberID, {
      [selectedChannel.type === "text"
        ? "SEND_MESSAGES"
        : "CONNECT"
      ]: false
    });
    
    const memberLockouts = cache.lockout.get(memberID) || [];
    memberLockouts.push(selectedChannel.id);
    cache.lockout.set(memberID, memberLockouts);
    
    successes.push(`<#${selectedChannel.id}>`);
    return cache.save("lockout");
  }));
  
  return messageSuccess(successes.length
      ? `Successfully locked out <@${memberID}> from channel(s): ${successes.join(", ")}`
      : "")
    .addFields(errors.length
      ? [{
        name: "Errors",
        value: errors.join("\n")
      }]
      : [])
}

async function parse({
  pack,
  channels, members, messageError
}, [ rawAction, memberTag, channelTags ]) {
  // $blacklist @member command/channel
  console.log(!!rawAction);
  if (!rawAction) return messageError("You need to provide the action you want to perform in this command!");
  const action = rawAction.toLowerCase();

  // MEMBER
  if (!memberTag) {
    if (action === "view") return { action };
    else return messageError("You need to mention the member you want to lock out!");
  }
  
  const [, memberID] = memberTag.match(/^(?:<@)?(\d+)>?/) || [];
  if (!memberID && action === "set") return messageError("The member you mentioned is invalid!");
  
  const targetMember = await pack.resolve(members, memberID);
  if (!targetMember) return messageError("The member mentioned is not a part of this guild!");
  
  if (action === "view") return { action, memberID };
  
  // CHANNELS
  if (!channelTags.length) return messageError("You have not provided the channel(s) you want to lock out the member from!");
  
  const channelIDs = channelTags.map(channelID => (channelID.match(/^(?:<#)?(\d+)>?/) || [])[1]);

  const selectedChannels = channelIDs.map(channelID => channels.resolve(channelID));
  const invalidChannels = channelIDs.some(channelID => !channels.cache.has(channelID))
  if (invalidChannels.length) return messageError(`The channel${invalidChannels.length > 1 ? "s" : ""} (by ID) **${invalidChannels.join(", ")}** ${invalidChannels.length > 1 ? "do" : "does" } not exist in this guild!`);
  
  return { action, targetMember, memberID, selectedChannels };
}