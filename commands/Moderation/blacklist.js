const {
  PERMISSIONS: {
    HIERARCHIES: { MASTER, MOD, EVERYONE, BLACKLISTED_LOW }, 
    TRENDS: { CURRENT_BELOW, CURRENT_ONLY, CURRENT_ABOVE }
  }
} = require(`../../constants.js`);

const actions = {
  view,
  remove,
  set
};

module.exports = {
  description: "Blacklist a member",
  icon: {
    emoji: "📕",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/236/closed-book_1f4d5.png"
  },
  args: {
    usage: [{
      title: "Blacklist a member from using a command",
      parameters: [
        "[Member ID/Mention]",
        "[Command]"
      ]
    }],
    detectors: [
      /^set|view|remove/i,
      /^(?:<@)?(\d+)>?/,
      /\w+/g
    ]
  },
  run,
  parse
};

async function run(pack, { action, ...data }) {
  return actions[action](pack, data);
}

async function view({ cache, messageDefault }, { memberID: selectedMember = "" }) {
  const targetMembers = selectedMember
    ? [ selectedMember, cache.memberPermissions.getOrMake(selectedMember) ]
    : Array.from(cache.memberPermissions.entries());
  
  const list = targetMembers
    .filter(([, { commandHierarchies = {} }]) =>
      Object.keys(commandHierarchies).length
        && Object.values(commandHierarchies).some(hierarchy => hierarchy > EVERYONE)
    )
    .map(([memberID, { commandHierarchies = {} }]) => {
      const blacklists = Object.entries(commandHierarchies)
        .filter(([c, hierarchy]) => hierarchy > EVERYONE)
        .map(([command]) => `\`${command}\``)
        .join(", ");
        
      return `<@${memberID}> (ID: ${memberID}) blacklisted from using command(s): ${blacklists}`;
    });
    
    return messageDefault(list.join("\n") || "*Seems like members have not been naughty lately*");
}
async function remove({ cache, messageSuccess }, { memberID, selectedCommands }) {
  const memberPermission = cache.memberPermissions.getOrMake(memberID);
  const memberHierarchies = memberPermission.commandHierarchies;
  
  for (const selectedCommand of selectedCommands) {
    delete memberHierarchies[selectedCommand.toLowerCase()];
  }
    
  cache.memberPermissions.set(memberID, { ...memberPermission, commandHierarchies: memberHierarchies });
  
  return Promise.all([
    cache.save("memberPermissions"),
    messageSuccess(`Successfully unblacklisted the mentioned member in command${selectedCommands.length > 1 ? "s" : ""} ${selectedCommands.join(", ")}!`)
  ]);
}
async function set({ cache, messageSuccess }, { memberID, selectedCommands }) {
  const { commandHierarchies } = cache.memberPermissions.getOrMake(memberID);
        
  selectedCommands.forEach(selectedCommand => {
    return commandHierarchies[selectedCommand] = BLACKLISTED_LOW;
  });
  
  return Promise.all([
    cache.save("memberPermissions"),
    messageSuccess(`Successfully blacklisted the mentioned member in command${selectedCommands.length > 1 ? "s" : ""} **${selectedCommands.join(", ")}**!`)
  ]);
}

function parse({
  commands, pack,
  channels, members, messageError
}, [rawAction, selectedMember, selectedCommands]) {
  console.log(rawAction, selectedMember, selectedCommands);
  // $blacklist action @member command
  if (!rawAction) return messageError("You need to provide the action you want to perform in this command!");
  const action = rawAction.toLowerCase();

  // MEMBERS
  if (!selectedMember) { 
    if (action === "view") return { action };
    else return messageError("You need to mention the member who you want to blacklist!");
  }
  
  const memberID = (selectedMember.match(/^(?:<@)?(\d+)>?/) || [])[1];

  if (!memberID) return messageError("The member you mentioned is invalid!");
  if (!members.resolve(memberID)) return messageError("The member mentioned is not a part of this guild!");

  if (action === "view") return { action, memberID };

  // 
  if (!selectedCommands.length) return messageError("You did not provide the command(s) you want to blacklist for the member!");

  const invalidCommands = selectedCommands.filter(selectedCommand => !commands.has(selectedCommand.toLowerCase()))
  if (invalidCommands.length) return messageError(`The commands mentioned do not exist: ${invalidCommands.join(", ")}`);

  return { action, memberID, selectedCommands };
}