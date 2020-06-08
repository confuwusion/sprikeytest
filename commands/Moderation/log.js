module.exports = {
  description: "Manages logging channels",
  icon: {
    emoji: "📄",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/236/page-facing-up_1f4c4.png"
  },
  args: {
    usage: [{
      title: "View all logging channels",
      parameters: [
        "view"
      ]
    }, {
      title: "Set a logging channel",
      parameters: [
        "set",
        "[Log Type]",
        "[Channel Tag]"
      ]
    }, {
      title: "Remove a logging channel",
      parameters: [
        "remove",
        "[Log Type]"
      ]
    }],
    detectors: [
      /^set|view|remove/i,
      /^\w+/,
      /^(?:<#)?\d+>?/
    ]
  },
  run,
  parse
}

const actions = {
  set,
  view,
  remove
};

async function run(pack, { action, ...data }) {
  return actions[action](pack, data);
}

async function view({ cache, messageDefault }) {
  const associations = Array.from(cache.logChannels.entries())
      .map(([logType, logChannelID]) => `${logType}: <#${logChannelID}>`)
      .join("\n");
  
  return messageDefault(associations);
}
async function remove({ cache, channel, messageSuccess }, { logType }) {
  const channelID = cache.logChannels.get(logType);
  cache.logChannels.delete(logType);
  
  return Promise.all([
    cache.save("logChannels"),
    messageSuccess(`Successfully removed the log association **${logType}** from channel <#${channelID}>!`)
  ]);
}
async function set({ cache, channel, messageSuccess }, { logType, channelID }) {
  cache.logChannels.set(logType, channelID);
  
  return Promise.all([
    cache.save("logChannels"),
    messageSuccess(`Successfully set channel <#${channelID}> as **${logType}** channel!`)
  ]);
}

function parse({ cache, channels, messageError }, [ rawAction, logType, channelTag ]) {
  // $log action #channel client
  if (!rawAction) return messageError("You need to provide the action you want to perform in this command!");
  const action = rawAction.toLowerCase();
  if (action === "view") return { action };
  
  // LOG TYPE
  const registered = cache.logChannels.get(logType);
  
  if (action === "remove") {
    if (!registered) return messageError(`There is no registered channel to log action **${logType}**!`);
    return { action, logType };
  }
  
  if (registered && channels.resolve(registered)) return messageError(`The log action **${logType}** is already registered to channel <#${registered}>!`);
  
  // CHANNEL
  const [, channelID] = channelTag.match(/<?#?(\d*)>?/);
  const selectedChannel = channels.resolve(channelID);
    
  if (!selectedChannel) return messageError(`The channel by ID \`${channelID}\` does not exist!`);
  
  return { action, logType, channelID };
}

// TEST DATA

// Normal Data

// $log set log-type #valid-channel
// Where log-type is a string value of any length and any combinations of characters, and is not already registered. If it is, then an error should be shown
// Should set and send a success message

// $log view
// Send a message about all registered log channels

// $log remove log-type
// Where log-type is a string value of any length and any combinations of characters, and is already registered. If not, then an error should be shown
// Should be removed and a send a success message

// - Test Boundaries

// Try all combinations of data types for log-type
// Try leaving out arguments
// Try setting all channels and see if the log feature works
// Try setting invalid channels
// Try setting channels with incomplete tag
// Try setting newly created channels
// Try testing log feature on a deleted log channel