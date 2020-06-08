module.exports = {
  description: "View bot help",
  icon: {
    emoji:"ℹ",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/236/information-source_2139.png"
  },
  args: {
    blank: "to view Help Menu",
    usage: [{
      title: "View Command Help Menu",
      parameters: [
        "[Command Name]"
      ]
    }],
    detectors: [
      /^\w+/
    ]
  },
  parse,
  run
}

async function run({
  pack, client, categories,
  messageDefault
}, { selectedCommand }) {
  if (selectedCommand) return commandHelp(pack, selectedCommand);
  
  const categoryList = Array.from(categories.keys())
    .map(category => `❯ ${category}`)
    .join("\n");
  const links = [
    `<:Discord:698472672509558784> [Communimate](https://discord.gg/mXcZDe9)`,
    `<:YouTube:698472732546826281> [Communimate ANIMATIONS](https://www.youtube.com/channel/UC5gbnjxaa68hwonvSpqH9dQ)`,
    `<:Twitter:698472800142360585> [Communimate (@the_rockho)](https://twitter.com/the_rockho?s=09)`
  ].join("\n");
  
  return messageDefault(`Hello there young lad! Looks like you're a bit lost, so lemme guide you around.
    
I have a list of commands that enhance your interaction with the features of this server, which you can view by \`$commands [Category Name]\`, where \`[Category Name]\` is one of the categories listed below.
    
Not sure how to use a command? Open up its help menu by using command \`$help [Command Name]\` where \`[Command Name]\` is that command's name.`)
    .addFields([{
      name: "Categories",
      value: categoryList
    }, {
      name: "Links",
      value: links
    }]);
}

function commandHelp({ messageDefault }, selectedCommand) {
  const {
    commandName,
    description,
    icon: {
      url: icon_url
    },
    args: {
      blank,
      usage = []
    }
  } = selectedCommand;
  
  const uses = usage.map(({
    title, description: desc, parameters = [], descriptor
  }) => {
    const commandUsage = `\`\`\`$${commandName} ${parameters.join(" ")}\`\`\``;
    return `▫️ **${title}**${desc ? `\n${desc}` : ""}${parameters.length ? `\n${commandUsage}` : ""}${descriptor ? `\n${descriptor}` : ""}`;
  }).join("\n");
  
  return messageDefault(description)
    .setAuthor(`Help Menu | $${commandName}`, icon_url)
    .addFields([{
      name: "Usage",
      value: `${blank ? `*Leave blank to ${blank}*\n` : ""}${uses}`
    }]);
}

function parse({ commands, messageError, pack }, [ rawCommandName ]) {
  if (!rawCommandName) return {};
  
  const commandName = rawCommandName.toLowerCase();
  const command = commands.get(commandName);
  if (!command) return messageError("You have provided an invalid Command Name!");
  
  return { selectedCommand: {
    commandName,
    ...command
    }
  };
}