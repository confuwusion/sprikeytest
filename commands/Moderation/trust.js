const {
  PERMISSIONS: { 
    HIERARCHIES: { EVERYONE, TRUSTED_LOW }
  }
} = require("../../constants.js");

module.exports = {
  description: "Trust a member with a command",
  icon: {
    emoji: "🤝",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/248/handshake_1f91d.png"
  },
  args: {
    usage: [{
      title: "View all trusted members and their trusted commands",
      parameters: [
        "view"
      ]
    }, {
      title: "Trust someone with a trustable command",
      parameters: [
        "add",
        "[Member]",
        "[Trust Command]"
      ]
    }, {
      title: "Revoke trust from someone on a command",
      parameters: [
        "revoke",
        "[Member]",
        "[Trust Command]"
      ]
    }, {
      title: "Revoke trust from someone on all trusted commands",
      parameters: [
        "revokeAll",
        "[Member]",
        "yes"
      ]
    }],
    detectors: [
      /^add|revokeAll|revoke|view/,
      /^(?:<@)?\d+>?/,
      /^\w+/
    ]
  },
  parse,
  run
}

const actions = {
  add,
  view,
  revoke,
  revokeall
};

async function run(pack, { action, ...data }) {
  return actions[action](pack, data);
}

async function view({ cache, messageDefault }) {
  const memberPermissions = Array.from(cache.memberPermissions.entries());
  const trustedMembers = memberPermissions
    .filter(([, { commandHierarchies }]) => {
      return Object.entries(commandHierarchies)
        .find(([, hierarchy]) => {
          return hierarchy < EVERYONE;
        });
    });
  const formattedTrusted = trustedMembers
    .map(([ memberID, { commandHierarchies } ]) => {
      return `<@${memberID}>: ${
        Object.keys(commandHierarchies)
        .join(", ")
      }`;
    })
    .join("\n");
  
  return messageDefault(formattedTrusted || "*There are no trusted members*");
}

async function add({ cache, messageSuccess }, { commandName, memberID }) {
  const { commandHierarchies } = cache.memberPermissions.get(memberID);
  commandHierarchies[commandName] = TRUSTED_LOW;
  
  return Promise.all([
    cache.save("memberPermissions"),
    messageSuccess(`Successfully trusted the provided member with command **${commandName}**!`)
  ]);
}

async function revoke({ cache, messageSuccess }, { commandName, memberID }) {
  const { commandHierarchies } = cache.memberPermissions.get(memberID);
  delete commandHierarchies[commandName];
  
  return Promise.all([
    cache.save("memberPermissions"),
    messageSuccess(`Successfully revoked trust from the provided member from command **${commandName}**!`)
  ]);
}

async function revokeall({ cache, messageSuccess }, { memberID, trustedCommands }) {
  const { commandHierarchies } = cache.memberPermissions.get(memberID);
  
  const revokedTrusts = trustedCommands
    .map(([ commandName ]) => {
      return [
        commandName,
        delete commandHierarchies[commandName]
      ];
    })
    .filter(([, deleted]) => deleted);
  
  return Promise.all([
    cache.save("memberPermissions"),
    messageSuccess(`Successfully revoked the provided member from the following commands: ${revokedTrusts.join(", ")}`)
  ]);
}

function parse({ client, cache, commands, member, messageError }, [ rawAction, memberTag, trustOrCommand ]) {
  if (!rawAction) return messageError("You did not provide the action you want to perform in this command!");
  const action = rawAction.toLowerCase();
  
  if (action === "view") return { action };
  
  if (!memberTag) return messageError("You provided an invaild member!");
  const [, memberID] = memberTag.match(/(?:<@)?(\d+)>?/) || [];
  
  const { baseHierarchy, commandHierarchies } = cache.memberPermissions.getOrMake(memberID);
  
  if (["add", "revoke"].includes(action)) {
    if (baseHierarchy < EVERYONE) return messageError("You can't manage this member as they have a hierarchy greater than everyone else hierarchy!");
    
    const commandName = trustOrCommand.toLowerCase();
    if (!commands.has(commandName)) return messageError(`A command by name **${commandName}** does not exist!`);
    
    if (action === "add") {
      if (commandHierarchies[commandName] < EVERYONE) return messageError("The member is already trusted with the selected command!");
      
      const {
        permission: { hierarchy, trend}
      } = commands.get(commandName);
      
      if (!cache.memberPermissions.compare(hierarchy, trend, TRUSTED_LOW)
          && cache.memberPermissions.compare(hierarchy, trend, EVERYONE)) return messageError(`The command **${commandName}** is not a trustable command!`);
    }
    if (action === "revoke" && !commandHierarchies[commandName]) return messageError("The member is not trusted with the selected command!");
    
    return { action, memberID, commandName };
  }
  
  if (trustOrCommand.toLowerCase() !== "yes") return messageError("You need to confirm this action by adding \"yes\" as input to the last parameter!");
  
  const trustedCommands = Object.entries(commandHierarchies)
    .filter(([, commandHierarchy ]) => commandHierarchy < EVERYONE);
  
  if (!trustedCommands.length) return messageError("The provided member is not trusted with any command!");
  
  return { action, memberID, trustedCommands };
}