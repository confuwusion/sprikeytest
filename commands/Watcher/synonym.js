module.exports = {
  description: "Register a word as a synonym to an existing censored word",
  icon: {
    emoji: "↔",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/247/left-right-arrow_2194.png"
  },
  args: {
    usage: [{
      title: "Set a synonym to a censored word",
      parameters: [
        "set",
        "[Censored Word]",
        "[Synonym]"
      ]
    }, {
      title: "Remove a synonym from a censored word",
      parameters: [
        "remove",
        "[Censored Word]",
        "[Synonym]"
      ]
    }],
    detectors: [
      /set|remove/,
      /^[a-z]+/i,
      /^[a-z]+/i
    ]
  },
  run,
  parse
};

const actions = {
  set,
  view,
  remove
};

async function run(pack, { action, ...data }) {
  return actions[action](pack, data);
}

async function view({ messageDefault }, { censor: { word, synonyms } }) {
  return messageDefault()
    .addFields([{
      name: `Symonyms registered for censored word ${word}`,
      value: synonyms.join(", ") || "*There are no synonyms for this censored word*"
    }])
    .author.name = "Censor Word Synonyms | View";
}

async function set({ cache, channel, messageSuccess }, { censor, synonym }) {
  const synonyms = [ ...censor.synonyms, synonym ];
  cache.wordCensor.set(censor.censorWord, { ...censor, synonyms });
  
  return Promise.all([
    cache.save("wordCensor"),
    messageSuccess(`Successfully set synonym "${synonym}" for censored word "${censor.censorWord}"!`)
  ]);
}

async function remove({ cache, messageSuccess }, { censor, synonym }) {
  const synonymIndex = censor.synonyms.indexOf(synonym);
  const synonyms = [ ...censor.synonyms.slice(0, synonymIndex), ...censor.synonyms.slice(synonymIndex + 1) ];
  cache.wordCensor.set(censor.censorWord, { ...censor, synonyms });
  
  return Promise.all([
    cache.save("wordCensor"),
    messageSuccess(`Successfully set synonym "${synonym}" for censored word "${censor.censorWord}"!`)
  ]);
}

function parse({ cache, channel, messageError }, [ rawAction, censorWord, synonym ]) {
  if (!rawAction) return messageError("You did not provide the action you want to perform in this command!");
  const action = rawAction.toLowerCase();
  
  if (!censorWord) return messageError("You did not provide the censored word you want to work with!");
  
  const censor = cache.wordCensor.get(censorWord.toLowerCase());
  if (!censor) return messageError(`The word \`${censorWord}\` is not censored!`);
  
  if (action === "view") return { action, censor };
  
  if (!synonym) return messageError("You did not provide the synonym you want to set to the censored word!");
  if (action === "set" && censor.synonyms.includes(synonym)) return messageError("The provided synonym already exists for the censored word!");
  if (action === "remove" && !censor.synonyms.includes(synonym)) return messageError("The provided synonym does not exist for the censored word!");

  return { action, censor, synonym };
}
