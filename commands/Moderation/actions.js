module.exports = {
  description: "View registered actions",
  icon: {
    emoji: "🗯",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/236/right-anger-bubble_1f5ef.png"
  },
  args: {
    blank: "to view actions",
    usage: [{
      title: "View all Actions",
      parameters: [
        "viewAction"
      ]
    }, {
      title: "View an Action's Usage",
      parameters: [
        "viewAction",
        "[Action Name]"
      ]
    }, {
      title: "View all Action Data",
      parameters: [
        "viewData"
      ]
    }, {
      title: "View specific Action Data",
      parameters: [
        "viewData",
        "[Action Data Code]"
      ]
    }, {
      title: "Set an Action Data",
      parameters: [
        "set",
        "[Action Name]",
        "<[Text]> OR [Word] (multiple separated by a space)"
      ]
    }, {
      title: "Remove an Action Data",
      parameters: [
        "remove",
        "[Action Data Code]"
      ]
    }],
    detectors: [
      /^set|viewaction|viewdata|remove/i,
      /^\w+/,
      /<[^]+?(?<!\\)>|\w+/g
    ]
  },
  run,
  parse
}

const actions = {
  set,
  viewaction,
  viewdata,
  remove
};

async function run(pack, { action, ...data }) {
  return actions[action](pack, data);
}

async function viewaction({ botActions, messageDefault }, { actionName }) {
  const { description, usage } = botActions.actions.get(actionName);
  
  return messageDefault(description)
    .addFields([{
      name: "Usage",
      value: `\`\`\`${usage}\`\`\``
    }]).author.name = `Bot Actions | View ${actionName}`;
}

async function viewdata({ botActions, messageDefault }, { actionDataCode }) {
  if (!actionDataCode) {
    const allData = botActions.actionData.map(([actionCode, { actionName, actionData }]) => {
      return `**${actionCode}** (${actionName}): \`${actionData.join("`, `")}\``;
    });
    
    return messageDefault(allData.join("\n") || "*There is not data registered*")
      .author.name = "Bot Actions | View All Data"
  }
  
  const { actionName, actionData } = botActions.actionData.get(actionDataCode);
  const formattedData = actionData.map(data => `▫️ ${data}`);
  
  return messageDefault(`Set for action **${actionName}**`)
    .addFields([{
      name: "Action Data",
      value: formattedData.join("\n")
    }]).author.name = `Bot Actions | View Data #${actionDataCode}`;
}

async function remove({ botActions, cache, messageSuccess }, { actionDataCode }) {
  const { actionName } = botActions.actionData.get(actionDataCode);
  botActions.actionData.remove(actionDataCode);
  
  return Promise.all([
    cache.save("actionData"),
    messageSuccess(`Successfully removed Action Data of action, by name, "${actionName}" from code \`${actionDataCode}\`!`)
  ]);
}

async function set({ botActions, cache, messageSuccess }, { actionName, parsedArgs }) {
  const actionData = botActions.register(parsedArgs);
  
  return Promise.all([
    cache.save("actionData"),
    messageSuccess(`Successfully set the provided data as the Action Data of action, by name, "${actionName}" on code \`${actionData.actionCode}\`!`)
  ]);
}

function parse({ botActions, cache, messageError }, [ rawAction, nameOrCode, actionArgsStr ]) {
  if (!rawAction) return messageError("You need to provide the action you want to perform in this command!");
  const action = rawAction.toLowerCase();
  
  if (["viewdata", "remove"].includes(action)) {
    const actionDataCode = parseInt(nameOrCode, 10) || 0;
    if (isNaN(actionDataCode)) return messageError("You provided an invalid Action Data Code!");
    
    if (action === "viewdata" && actionDataCode > 0 && !botActions.actionData.has(actionDataCode)) return messageError(`Action Data by ID \`${actionDataCode}\` does not exist!`);
    if (action === "remove" && !botActions.actionData.has(actionDataCode)) return messageError(`Action Data by ID \`${actionDataCode}\` does not exist!`);
    
    return { action, actionDataCode };
  }
  
  const actionName = nameOrCode.toLowerCase();
  if (!botActions.actions.has(actionName)) return messageError(`An action by name "${actionName}" does not exist!`);
  
  if (action === "viewaction") return { action, actionName };
  
  const actionData = actionArgsStr.map(actionArg => {
    const [, longArg, shortArg] = actionArg.match(/<([^]+?)(?<!\\)>|(\w+)/);
    return longArg || shortArg;
  });
  
  const parsedArgs = botActions.parseAction({ actionName, actionData });
  if (parsedArgs.processedData instanceof Error) return messageError(parsedArgs.processedData.message);
  
  return { action, actionName, parsedArgs };
}