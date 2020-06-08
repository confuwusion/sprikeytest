const { extractArgs } = require("../../methods/extractArgs.js");

const hierarchyTag = [
  "the Bot Master",
  "Rockho",
  "the Admins",
  "the Mods",
  "trusted tier 3 members",
  "trusted tier 2 members",
  "trusted tier 1 members",
  "almost anyone",
  "blscklisted tier 1 members",
  "blacklisted tier 2 members",
  "blacklisted tier 3 members"
];
const trendTag = [
  "and below",
  "only",
  "and above"
];

const actions = {
  view,
  remove,
  set
};

module.exports = {
  description: "Allows creation of commands with modified permissions and prefilled, input-accepting commands.",
  icon: {
    emoji: "🖇",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/236/linked-paperclips_1f587.png"
  },
  args: {
    usage: [{
      title: "View all subcommand details",
      parameters: [
        "view"
      ]
    }, {
      title: "Set a subcommand",
      parameters: [
        "set",
        "[Subcommand Name]",
        "[Inheriting Command Name]",
        "[Hierarchy]:[Hierarchy Trend]",
        "exclusive/non-exclusive",
        "[Channel(s)?]",
        "[Argument Fillers]"
      ]
    }, {
      title: "Remove a subcommand",
      parameters: [
        "remove",
        "[Subcommand Name]"
      ]
    }],
    detectors: [
      /^set|view|remove/,
      /^\w+/,
      /^\w+/,
      /^\d{1,2}\:\d/,
      /^exclusive|non-exclusive/i,
      /(?:<#)?\d+>?/g,
      /^.+/
    ]
  },
  run,
  parse
};

async function run(pack, {action, ...data}) {
  return actions[action](pack, data);
}

async function view({ cache, messageDefault }) {
  const subcommands = cache.subcommands.toArray.entries();
  
  const list = subcommands.map(([subcommand, data]) => {
    const {
      inherits, 
      hierarchy,
      trend,
      fillers
    } = data;
    return `**${subcommand}** (*extends ${inherits}*): Can be used by ${hierarchyTag[hierarchy - 1]} ${trendTag[trend - 1]}. **Argument Filler:** ${fillers.join(" ;; ")}`;
  }).join("\n");
  
  return messageDefault(list);
}

async function remove({ cache, commands, messageSuccess }, { subcommandName }) {
  commands.delete(subcommandName);
  cache.subcommands.delete(subcommandName);
  
  return Promise.all([
    cache.save("subcommands"),
    messageSuccess(`Successfully deleted the subcommand **${subcommandName}**!`)
  ]);
}

async function set({ cache, commands, messageSuccess }, { name,  command, ...subOptions }) {
  const subcommand = command.createSub({ ...subOptions, name });
  commands.set(name, subcommand);
  
  cache.subcommands.set(name, {
    ...subOptions,
    name
  });
  
  return Promise.all([
    messageSuccess(`Successfully set **${name}** as a subcommand!`),
    cache.save("subcommands")
  ]);
}

function parse({ cache, channels, commands, messageError },
  [ rawAction, rawSubcommandName, selectedCommand, permissionStr, exclusiveTag, channelTags, argFillers ]) {
  if (!rawAction) return messageError("You did not provide the action you want to perform in this command!");
  const action = rawAction.toLowerCase();
  
  if (action === "view") return { action };
  
  if (!rawSubcommandName) return messageError("You did not provide a name for your subcommand!");
  
  const subcommandName = rawSubcommandName.toLowerCase();
  
  if (commands.has(subcommandName) && !commands.get(subcommandName).inherits) return messageError(`The provided name **${subcommandName}** is being used by a native command!`);
  
  if (action === "remove") return { action, subcommandName };
  if (cache.subcommands.has(subcommandName)) return messageError(`A subcommand by name **${subcommandName}** already exists!`);
    
  // COMMAND
  // Checking selected command's existence
  if (!selectedCommand) return messageError("You did not provide the name of the command you are subbing!");
  
  const command = commands.get(selectedCommand.toLowerCase());
  if (!command) return messageError(`The provided command by name **${selectedCommand}** does not exist!`);
  if (command.inherits) return messageError("You cannot make subcommands of other subcommands!");
  
  if (action === "remove") return { action, subcommandName };
  
  // HIERARCHY
  if (!permissionStr) return messageError("You provided an invalid value for the permission parameter!");
  
  const [ hierarchy, trend ] = permissionStr.split(":").map(num => parseInt(num, 10));
  
  if (!hierarchy || !trend) return messageError("You provided invalid permission for your subcommand!");
  if (hierarchy > hierarchyTag.length || hierarchy < 1) return messageError("The hierarchy integer you've provided is out of range! It should be a number anywhere in between of 1 and 11 (inclusive).");
  if (trend > 3 || trend < 1) return messageError("The hierarchy trend integer is out of range! It should be a number anywhere in between of 1 and 3 (inclusive)");
  
  // CHANNELS
  if (!exclusiveTag) return messageError("You did not mention whether this subcommand is exclusive or non-exclusive!");
  const exclusive = !!(["non-exclusive", "exclusive"]).indexOf(exclusiveTag.toLowerCase());
  
  if (exclusive && !channelTags.length) return messageError("You did not provide the channels this subcommand will br exclusive to!");
  
  console.log(exclusive, channelTags)
  
  const channelIDs = channelTags.map(channelTag => channelTag.match(/(?:<#)?(\d+)>?/)[1]);
  const invalidChannels = channelIDs.filter(channelID => !channels.cache.has(channelID));
  
  if (invalidChannels.length) return messageError(`The following channels (by ID) are invalid: ${invalidChannels.join(", ")}`);
  
  // ARGUMENTS can't be tested
  const fillers = argFillers.split(" ;; ");
  
  return { action, name: subcommandName, command, inherits: command.name, hierarchy, trend, exclusive, channels: channelIDs, fillers };
}
