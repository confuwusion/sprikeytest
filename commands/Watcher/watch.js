module.exports = {
  description: "Watch a message textpattern in the server",
  icon: {
    emoji: "👁‍🗨",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/236/eye-in-speech-bubble_1f441-fe0f-200d-1f5e8-fe0f.png"
  },
  args: {
    usage: [{
      title: "View all watch patterns",
      parameters: [
        "view"
      ]
    }, {
      title: "Set a watch pattern",
      parameters: [
        "set",
        "[RegExp]",
        "-channels:focus/ignore:[Channel Tag] (multiple channels separated by a comma)",
        "-members:focus/ignore:[Member Tag/ID] (multiple members separated by a comma)",
        "-roles:focus/ignore:[Role ID] (multiple channels separated by a comma)",
        "-action:[Action Name]:[Action Data] (multiple action tags for separate actions)"
      ]
    }, {
      title: "Remove a watch pattern",
      parameters: [
        "remove",
        "[Pattern ID]"
      ]
    }],
    detectors: [
      /^set|view|remove/i,
      /\/[^]+?(?<!\\)\/[ig]*|\d+/,
      /^-channels:(focus|ignore):(?:(?:<#)?\d+>?,?)+/i,
      /^-members:(focus|ignore):(?:(?:<@)?\d+>?,?)+/i,
      /^-roles:(focus|ignore):(?:(?:<@&)?\d+>?,?)+/i,
      /^-actions:(?:\d+,?)+/i
    ]
  },
  run,
  parse
}

const instanceType = {
  focus: true,
  ignore: false,
  true: "Focus",
  false: "Ignore"
};

const actions = {
  view,
  remove,
  set
};

async function run(pack, { action, ...data }) {
  return actions[action](pack, data);
}


async function view({ cache, messageDefault }, { patternCode }) {
  if (patternCode) {
    const {
      pattern,
      actionRegistries,
      criteria: {
        channelIDs,
        channelType,
        memberIDs,
        memberType,
        roleIDs,
        roleType
      }
    } = cache.watchPatterns.get(patternCode);
    
    return messageDefault(`**Pattern:** \`/${pattern[0]}/${pattern[1]}\``)
      .addFields([{
        name: "Criteria",
        value: [
          `▫️ ${instanceType[channelType]} channel(s): ${channelIDs.map(channelID => `<#${channelID}>`).join(", ") || "*All*"}`,
          `▫️ ${instanceType[memberType]} member(s): ${memberIDs.map(memberID => `<@${memberID}>`).join(", ") || "*All*"}`,
          `▫️ ${instanceType[roleType]} role(s): ${roleIDs.map(roleID => `<@&${roleID}>`).join(", ") || "*All*"}`
        ].join("\n")
      }, {
        name: "Actions",
        value: `The registered Action Codes are:\n${actionRegistries.map(({ actionCode }) => actionCode).join(", ") || "*None*"}`
      }])
      .author.name = "Watch Pattern | View";
  }
  const patternEntries = cache.watchPatterns.map(([ watcherCode, { pattern } ]) => {
    return `▫️ #${watcherCode}: /${pattern[0]}/${pattern[1]}`;
  }).join("\n");

  return messageDefault(patternEntries)
    .author.name = "Watch Pattern | View All";
}
async function remove({ cache, messageSuccess }, { patternCode }) {
  const pattern = [ ...cache.watchPatterns.get(patternCode).pattern ];
  cache.watchPatterns.delete(patternCode);
  
  return Promise.all([
    cache.save("watchPatterns"),
    messageSuccess(`Successfully removed pattern \`/${pattern[0]}/${pattern[1]}\` from Pattern Code \`${patternCode}\``)
  ]);
}
async function set({ cache, messageSuccess }, patternData) {
  const patternCode = cache.watchPatterns.register(patternData);
  
  return Promise.all([
    cache.save("watchPatterns"),
    messageSuccess(`Successfully set pattern \`/${patternData.pattern[0]}/${patternData.pattern[1]}\` on Pattern Code \`${patternCode}\`!`)
  ]);
}

function parse({ botActions, cache, channels, members, roles, messageError }, [ rawAction, patternTag, channelField, memberField, roleField, actionField ]) {
  // $watch word @member/#channel/@&role:focus/ignore -log:type:<message> -warn:<message> -mute:<reason> -kick:<reason>
  // $watch set pattern -channels:focus:#channel,#channel -members:focus:@member,@member -roles:focus:RoleID,RoleID -action:log,<message>,type
  if (!rawAction) return messageError("You did not provide the action you want to perform in this command!");
  const action = rawAction.toLowerCase();

  // If selection is [view/remove], consider pattern as patternID for viewing/deleting patterns
  if (["view", "remove"].includes(action)) {
    const patternCode = !patternTag ? 0 : parseInt(patternTag, 10);
    console.log(patternTag, patternCode);
    if (isNaN(patternCode)) return messageError("You provided an invalid Pattern ID!");
    
    if (action === "view" && patternCode > 0 && !cache.watchPatterns.has(patternCode)) return messageError(`The pattern by code \`${patternCode}\` does not exist!`);
    if (action === "remove" && !cache.watchPatterns.has(patternCode)) return messageError(`The pattern by code \`${patternCode}\` does not exist!`);
    
    return { action, patternCode };
  }
  
  if (!patternTag) return messageError("You did not provide a pattern that you want to watch!");
  
  const [, patternSource, patternFlags = ""] = patternTag.match(/\/([^]+?)(?<!\\)\/([ig]+)?/);
  
  // Channel Parsing
  const [, channelTypeStr = "focus", channelTags = ""] = channelField.match(/^-channels:(focus|ignore):((?:(?:<#)?\d+>?,?)+)/i) || [];
  const channelIDs = channelTags.split(",").filter(Boolean)
    .map(channelTag => channelTag.match(/(?:<#)?(\d+)>?/)[1]);
  
  const invalidChannels = channelIDs.filter(channelID => !channels.cache.has(channelID));
  if (invalidChannels.length) return messageError(`The following channels by IDs are invalid: ${invalidChannels.join(", ")}`);
  
  // Member Parsing
  const [, memberTypeStr = "focus", memberTags = ""] = memberField.match(/^-members:(focus|ignore):((?:(?:<@!?)?\d+>?,?)+)/i,) || [];
  const memberIDs = memberTags.split(",").filter(Boolean)
    .map(memberTag => memberTag.match(/(?:<@)?!?(\d+)>?/)[1]);
  
  const invalidMembers = memberIDs.filter(memberID => !members.cache.has(memberID));
  if (invalidChannels.length) return messageError(`The following members by IDs are invalid: ${invalidMembers.join(", ")}`);
  
  // Role Parsing
  const [, roleTypeStr = "focus", roleTags = ""] = roleField.match(/^-roles:(focus|ignore):((?:(?:<@&)?\d+>?,?)+)/i) || [];
  const roleIDs = roleTags.split(",").filter(Boolean)
    .map(roleID => roleID.match(/(?:<@&)?(\d+)>?/)[1]);
  
  const invalidRoles = roleIDs.filter(roleID => !roles.cache.has(roleID));
  if (invalidRoles.length) return messageError(`The following roles by IDs are invalid: ${invalidRoles.join(", ")}`);
  
  // Action Parsing
  if (!actionField) return messageError("You did not provide the actions that are supposed to be carried out as a result of this watch pattern!");
  
  const actionIDs = actionField.match(/^-actions:((?:\d+,?)+)/i)[1].split(",").filter(Boolean);
  const actionRegistries = actionIDs.map(actionIDStr => {
    const actionCode = parseInt(actionIDStr, 10);
    if (isNaN(actionCode)) return new Error(`You provided an invalid Action Code \`${actionIDStr}\`!`);
    
    const actionData = botActions.actionData.get(actionCode);
    if (!actionData) return new Error(`Action Data by code \`${actionCode}\` does not exist!`);
    
    return { actionName: actionData.actionName, actionCode };
  });
  
  const actionErrors = actionRegistries.filter(actionRegistry => actionRegistry instanceof Error);
  if (actionErrors.length) return messageError(`The following errors were encountered: \n${actionErrors.map(actionError => `▫️ ${actionError.message}`).join("\n")}`);
  /*
  return new MessageError(`> End of parsing
Action: ${action}

▫️Pattern
Source: ${patternSource}
Flags: ${patternFlags}

▫️Channels
Type: ${channelTypeStr}
Values: ${channelIDs.join(", ")}

▫️Members
Type: ${memberTypeStr}
Values: ${memberIDs.join(", ")}

▫️Roles
Type: ${roleTypeStr}
Values: ${roleIDs.join(", ")}
*/
  return {
    pattern: [ patternSource, patternFlags ],
    action,
    actionRegistries,
    criteria: {
      channelIDs,
      channelType: instanceType[channelTypeStr.toLowerCase()],
      memberIDs,
      memberType: instanceType[memberTypeStr.toLowerCase()],
      roleIDs,
      roleType: instanceType[roleTypeStr.toLowerCase()]
    }
  };
}