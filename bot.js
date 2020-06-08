// Modules
const fs = require("fs");
const Keyv = require("keyv");
const express = require("express");
const Discord = require("discord.js");
const sqlite3 = require("sqlite3");
const bufferJSON = require("json-buffer");
const { BotPack } = require("./structures/BotPack.js");
const { DataPack } = require("./structures/DataPack.js");
const { serialize, deserialize } = require("v8");

const {
  COMMUNIMATE_ID,
  TEST_GUILD_ID,
  ROLES: { ADMIN, MOD, D_ADMIN, D_MOD }
} = require("./constants.js");

// Database
const dbFile = "./data/sqlite.db";
const exists = fs.existsSync(dbFile);

const dbHandler = sqlite3.verbose();
const sqlDB = new dbHandler.Database(dbFile);
const database = new Keyv('sqlite://./data/sqlite.db', {
  serialize(data) {
    const serialized = serialize(data);
    return bufferJSON.stringify(serialized);
  },
  deserialize(data) {
    const dataBuffer = bufferJSON.parse(data);
    return deserialize(dataBuffer);
  }
});

database.on('error', err => console.error('Keyv connection error:', err));

// ExpressJS
const app = express();
app.use(express.static("public"));
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});
const listener = app.listen(
  process.env.PORT,
  () => console.log("Your app is listening on port " + listener.address().port)
);

// Client
const client = new Discord.Client({
  partials: [
    "MESSAGE",
    "REACTION",
    "GUILD_MEMBER",
    "USER"
  ],
  presence: {
    status: "idle",
    activity: {
      name: "Initiating Bot..."
    }
  }
});

async function ready() {
  console.timeEnd("Bot Login");
  console.time("Initiation");
  console.log("Bot Connected!");
  
  // Fetch client user if it is not cached
  !client.user.partial && client.user.fetch();
  
  // Load all important data from Discord
  const MAIN_GUILD = client.guilds.cache.get(COMMUNIMATE_ID);
  const TEST_GUILD = client.guilds.cache.get(TEST_GUILD_ID);
  
  const BLANK_ROLE = { members: new Map() };
  
  const [
    mainAdmin, mainMod,
    testAdmin, testMod
  ] = await Promise.all([
    MAIN_GUILD ? MAIN_GUILD.roles.fetch(ADMIN) : BLANK_ROLE,
    MAIN_GUILD ? MAIN_GUILD.roles.fetch(MOD) : BLANK_ROLE,
    TEST_GUILD ? TEST_GUILD.roles.fetch(D_ADMIN) : BLANK_ROLE,
    TEST_GUILD ? TEST_GUILD.roles.fetch(D_MOD) : BLANK_ROLE
  ]);
  
  // Initiating and loading cache
  const cache = require("./cache.js")(client, database);
  
  cache.roles = { mainAdmin, mainMod, testAdmin, testMod };
  
  console.time("Cache Load");
  cache.data_load_status = await cache.loadMissing();
  console.timeEnd("Cache Load");
  
  // Initiating Data pack
  const botPack = new BotPack(cache, client, MAIN_GUILD, TEST_GUILD);
  client.botPack = botPack;
  
  const dataPack = new DataPack(botPack);
  client.dataPack = dataPack;

  // Loading instances from project dir
  const loader = require("./loader.js")(dataPack);
  const loaded = {
    events: loader.load("./events", loader.registerEvent),
    commands: loader.load("./commands", loader.registerCommand),
    actions: loader.load("./actions", loader.registerAction),
    timeEvents: loader.load("./timeEvents", loader.registerTimeEvent)
  };
  cache.loaded_instances = loaded;
  
  cache.loaded_missed_events = dataPack.timeManager.loadMissed();
  
  cache.bot_last_active_interval = setInterval(() => {
    cache.botLastActive = Date.now();
    cache.save("botLastActive");
  }, 15000);
  
  // Setting subcommands
  cache.subcommands.toArray.entries().map(([ subcommandName, {
    inherits,
    ...subcommandData
  } ]) => {
    const subbingCommand = dataPack.commands.get(inherits);
    const subCommand = subbingCommand.createSub(subcommandData);
    
    dataPack.commands.set(subcommandName, subCommand);
  });
  
  // Show status as available
  await client.user.setPresence({
    status: "online",
    activity: {
      name: "with butterflies",
      type: "PLAYING"
    }
  });
 
  // Accept events
  botPack.eventState = true;
  
  if (cache.restartMessage.channelID) {
    const { channelID, messageID } = cache.restartMessage;
    const restartMessage = await client.channels.cache.get(channelID).messages.fetch(messageID);
    
    if (restartMessage) {
      (async function() {
        await restartMessage.reactions.removeAll();
        await restartMessage.react("709510035960496149");
      })();
      
      delete cache.restartMessage;
      cache.save("restartMessage");
    }
  }
  
  console.log("Bot is now listening to events!");
  console.timeEnd("Initiation");
}

client.on("ready", () => {
  ready()
  .catch(err => console.error(err) || client.user.setPresence({
    status: "dnd",
    activity: {
      name: "out for errors",
      type: "WATCHING"
    }
  }));
});

console.time("Bot Login");
client.login(process.env.TOKEN)
  .catch(err => (console.error(err), console.timeEnd("Bot Login")));