module.exports = {
  description: "Put a word under watch",
  icon: {
    emoji: "🔇",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/247/muted-speaker_1f507.png"
  },
  args: {
    usage: [{
      title: "View all watch words (with their synonyms)",
      parameters: [
        "view"
      ]
    }, {
      title: "Watch a word",
      parameters: [
        "set",
        "[Word]"
      ]
    }, {
      title: "Stop watching a word",
      parameters: [
        "remove",
        "[Word]"
      ]
    }],
    detectors: [
      /^view|set|aemove/,
      /^[a-z]+/i,
   ]
  },
  run,
  parse
};

const actions = {
  set,
  view,
  remove,
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
  cache.wordCensor.createCensor(censorWord);
  
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