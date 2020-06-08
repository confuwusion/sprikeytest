module.exports = {
  description: "Manage Word Censors",
  icon: {
    emoji: "🔇",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/247/muted-speaker_1f507.png"
  },
  args: {
    usage: [{
      title: "View all censored words (with their synonyms)",
      parameters: [
        "view"
      ]
    }, {
      title: "Censor a word",
      parameters: [
        "set",
        "[Word]",
        "[Ignore Channels]"
      ]
    }, {
      title: "Remove a character from an alphabet",
      parameters: [
        "remove",
        "[Word]"
      ]
    }, {
      title: "Remake the word's pattern when characters or synonyms are updated",
      parameters: [
        "rebase",
        "[Word]"
      ]
    }, {
      title: "Ignore a word (and all its synonyms) in a channel",
      parameters: [
        "addChannel",
        "[Word]",
        "[Channel Tag]"
      ]
    }, {
      title: "Unignore a word (and all its synonyms) from a channel",
      parameters: [
        "removeChannel",
        "[Word]",
        "[Channel Tag]"
      ]
    }],
    detectors: [
      /^view|set|addchannel|removechannel|watch|unwatch|rebase|remove/,
      /^[a-z]+/i,
      /(?:<#)?\d+>?/i
    ]
  },
  run,
  parse
};

const actions = {
  set,
  view,
  remove,
  watch,
  unwatch,
  rebase,
  addchannel,
  removechannel
};

async function run(pack, { action, ...data }) {
  return actions[action](pack, data);
}

async function view({ cache, messageDefault }) {
  const censoredWords = Array.from(cache.wordCensor.entries())
    .map(([ censorWord, { synonyms } ]) => {
      return `${censorWord}${synonyms.length ? ` (${synonyms.join(", ")})` : ""}`;
    })
    .join(", ");
  
  return messageDefault(censoredWords || "*There are no censored words*")
    .author.name = "Word Censor | View"
}

async function set({ cache, messageSuccess }, { censorWord }) {
  cache.wordCensor.createCensor(censorWord, "censor");
  
  return Promise.all([
    cache.save("wordCensor"),
    cache.save("watchPatterns"),
    messageSuccess(`Successfully censored word "${censorWord}"!`)
  ]);
}

async function remove({ cache, messageSuccess }, { censorWord, censorID }) {
  cache.watchPatterns.delete(censorID);
  cache.wordCensor.delete(censorWord);
  
  return Promise.all([
    cache.save("watchPatterns"),
    cache.save("wordCensor"),
    messageSuccess(`Successfully uncensored word "${censorWord}"!`)
  ]);
}

async function watch({ cache, messageSuccess }, { censorWord }) {
  cache.wordCensor.createCensor(censorWord, "watch");
  
  return Promise.all([
    cache.save("wordCensor"),
    cache.save("watchPatterns"),
    messageSuccess(`Successfully listed "${censorWord}" as watch word!`)
  ]);
}

async function unwatch({ cache, messageSuccess }, { censorWord, censorID }) {
  cache.watchPatterns.delete(censorID);
  cache.wordCensor.delete(censorWord);
  
  return Promise.all([
    cache.save("wordCensor"),
    cache.save("watchPatterns"),
    messageSuccess(`Successfully unlisted word "${censorWord}" from watch words!`)
  ]);
}

async function rebase({ cache, messageSuccess }, { censorWord, censorID, patternData }) {
  cache.wordCensor.rebaseCensor(censorWord);
  
  return Promise.all([
    cache.save("watchPatterns"),
    messageSuccess(`Successfully rebased censored word "${censorWord}"!`)
  ]);
}

async function addchannel({ cache, messageSuccess }, { censorWord, censorID, channelID, ignoredChannels, patternData }) {
  const newIgnores = [ ...ignoredChannels, channelID ];
  cache.watchPatterns.edit(censorID, {
    ...patternData,
    criteria: {
      ...patternData.criteria,
      channelIDs: newIgnores
    }
  });
  
  return Promise.all([
    cache.save("watchPatterns"),
    messageSuccess(`Censored word "${censorWord}" will now be ignored in channel <#${channelID}>!`)
  ]);
}

async function removechannel({ cache, messageSuccess }, { censorWord, censorID, channelID, ignoredChannels, patternData }) {
  const channelIndex = ignoredChannels.indexOf(channelID);
  const newIgnores = [ ...ignoredChannels.slice(0, channelIndex), ...ignoredChannels.slice(channelIndex + 1) ];
  cache.watchPatterns.edit(censorID, {
    ...patternData,
    criteria: {
      ...patternData.criteria,
      channelIDs: newIgnores
    }
  });
  
  return Promise.all([
    cache.save("watchPatterns"),
    messageSuccess(`Censored word "${censorWord}" will now be watched in channel <#"${channelID}>"!`)
  ]);
}

function parse({ cache, channels, messageError }, [ rawAction, rawCensorWord, channelOrSynonym ]) {
  if (!rawAction) return messageError("You did not provide the action you want to perform in this command!");
  const action = rawAction.toLowerCase();

  if (action === "view") return { action };
  
  if (!rawCensorWord) return messageError("You did not provide a word you want to work with!");
  const censorWord = rawCensorWord.toLowerCase();
  
  if (action === "set") {
    if (cache.wordCensor.has(censorWord)) return messageError(`The word "${censorWord}" is already censored!`);
    const synonymCensor = Array.from(cache.wordCensor.values()).find(({ synonyms }) => synonyms.includes(censorWord));
    if (synonymCensor) return messageError(`The word "${censorWord}" is set as the synonym of censor word "${synonymCensor.censorWord}"!`);
    
    return { action, censorWord };
  }
  
  const { censorID } = cache.wordCensor.get(censorWord);
  const patternData = cache.watchPatterns.get(censorID);
  
  if ([ "remove", "rebase", "addchannel", "removechannel" ].includes(action) && !cache.wordCensor.has(censorWord)) return messageError(`The word "${censorWord}" is not censored!`);
  if ([ "remove", "rebase" ].includes(action)) return { action, censorWord, censorID, patternData };
  
  const channelID = (channelOrSynonym.match(/(?:<#)?(\d+)>?/) || [])[1];
  if (!channelID) return messageError("You provided an invalid channel!");
  if (!channels.cache.has(channelID)) return messageError("The channel you provided is not a part of this guild!");
  
  const ignoredChannels = patternData.criteria.channelIDs;
  if (action.startsWith("add") && ignoredChannels.includes(channelID)) return messageError(`The provoded channel is already being ignored by the censor for the word "${censorWord}"!`);
  if (action.startsWith("remove") && !ignoredChannels.includes(channelID)) return messageError(`The provided channel was not being ignored by the censor for the word "${censorWord}"!`);
  
  return { action, censorWord, channelID, censorID, ignoredChannels, patternData };
}