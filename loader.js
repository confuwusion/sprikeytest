const fs = require("fs");
const { Action } = require("./structures/Action.js");
const { Command } = require("./structures/Command.js");
const { DataPack } = require("./structures/DataPack.js");

const { MASTER_ID } = require("./constants.js");

// Loader function
function load(path, handler, nesting = []) {
  const dirFiles = fs.readdirSync(path);
  const loaded = [];

  for (const dirFile of dirFiles) {
    if (!dirFile.endsWith(".js") && !(/\.\w+$/.test(dirFile))) {
      loaded.push(load(`${path}/${dirFile}`, handler, [...nesting, dirFile]));
      continue;
    } else if (!dirFile.endsWith(".js") && /\.\w+$/.test(dirFile)) continue;

    const [fileName] = dirFile.split(".");
    const fileData = require(`${path}/${dirFile}`);

    handler(fileName, fileData, nesting);
    loaded.push(fileName);
  }

  return loaded;
}

module.exports = function({
  botActions,
  categories,
  commands,
  timeManager,
  channels,
  client,
  pack
}) {
  function registerCommand(commandName, commandData, nesting) {
    const [category] = nesting;
    const command = Object.freeze(
      new Command({
        ...commandData,
        name: commandName,
        category
      })
    );

    commands.set(commandName, command);

    const clientCategory = categories.get(category) || {};

    clientCategory[commandName] = commandData;
    categories.set(category, clientCategory);
  }

  function registerEvent(eventFileName, eventData, nesting) {
    const eventName = nesting[0] || eventFileName;

    client.on(eventName, function(...args) {
      if (!pack.botPack.eventState
        && (
          eventName === "message"
          && args[0].author.id === MASTER_ID
          && !args[0].content.startsWith(`${process.env.PREFIX}exec`)
        )
      ) return;

      eventData(pack, ...args).catch(function(commandError) {
        console.error(commandError);

        const errorChannel = client.channels.cache.get("696095646226186320");

        return errorChannel.send(`\`\`\`js\n${commandError.stack}\`\`\``);
      });
    });
  }

  function registerAction(actionName, actionData) {
    const action = new Action(actionName, actionData);

    botActions.actions.set(actionName, action);
  }

  function registerTimeEvent(timeEventName, timeEventData) {
    timeManager.handlers.set(
      timeEventName,
      timeEventData.bind(timeEventData, pack)
    );
  }

  return {
    registerEvent,
    registerCommand,
    registerAction,
    registerTimeEvent,
    load
  };
};
