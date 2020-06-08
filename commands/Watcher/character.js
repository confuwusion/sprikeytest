module.exports = {
  description: "Register a similar character to the character dictionary",
  icon: {
    emoji: "🆎",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/247/ab-button-blood-type_1f18e.png"
  },
  args: {
    usage: [{
      title: "View all characters registered to an alphabet",
      parameters: [
        "view",
        "[Aplhabet]"
      ]
    }, {
      title: "Set a character to an alphabet",
      parameters: [
        "set",
        "[Alphabet]",
        "[Character]"
      ]
    }, {
      title: "Remove a character from an alphabet",
      parameters: [
        "remove",
        "[Alphabet]",
        "[Character]"
      ]
    }],
    detectors: [
      /view|set|remove/,
      /[a-z]/i,
      /[^a-z]+/i
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

async function view({ messageDefault }, { alphabet, alphabetChars }) {
  return messageDefault("")
    .addFields([{
      name: `Characters registered for alphabet ${alphabet}`,
      value: alphabetChars.join(", ") || "*There are no characters for this alphabet*"
    }])
    .author.name = "Character Dictionary | View";
}

async function set({ cache, messageSuccess }, { alphabet, alphabetChars, character }) {
  cache.characterDictionary.set(alphabet, [ ...alphabetChars, character ]);
  
  return Promise.all([
    cache.save("characterDictionary"),
    messageSuccess(`Successfully set character "${character}" for alphabet "${alphabet}"!`)
  ]);
}

async function remove({ cache, messageSuccess }, { alphabet, alphabetChars, character }) {
  const charIndex = alphabetChars.indexOf(character);
  const newChars = [ ...alphabetChars.slice(0, charIndex), ...alphabetChars.slice(charIndex + 1) ];
  cache.characterDictionary.set(alphabet, newChars);
  
  return Promise.all([
    cache.save("characterDictionary"),
    messageSuccess(`Successfully removed character "${character}" for alphabet "${alphabet}"!`)
  ]);
}

function parse({ cache, channel, messageError }, [ rawAction, alphabet, givenCharacter ]) {
  if (!rawAction) return messageError("You did not provide the action you want to perform in this command!");
  const action = rawAction.toLowerCase();
  
  if (!alphabet) return messageError("You did not provide the alphabet you want to manage!");
  
  const alphabetChars = cache.characterDictionary.get(alphabet) || [];
  if (action === "view") return { action, alphabet, alphabetChars };
  
  if (!givenCharacter) return messageError("You did not provide the character you want to set to the alphabet!");
  if (action === "set" && alphabetChars.includes(givenCharacter)) return messageError("The provided character already exists for the alphabet!");
  if (action === "remove" && !alphabetChars.includes(givenCharacter)) return messageError("The provided character does not exist for the alphabet!");
  
  const firstReplace = givenCharacter.replace(/\\?[^\\]/g, "\\\\?$&");
  
  const character = givenCharacter.replace("\\", "\\\\\\\\").replace(/[-[\]{}()*+?.,^$|#]/g, '(?:\\\\)?\\$&');
  const secondReplace = character.replace(/(\\?)([^\\])/g, "(?:\\\\\\\\)?$1");
  
  (`\`\`\`${givenCharacter}
${character}  :  ${new RegExp(character)} ${new RegExp(character).test("|\\\|")}
${secondReplace}\`\`\``);
  
  return { action, alphabet, alphabetChars, character };
}