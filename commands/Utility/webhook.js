const { encrypt } = require("../../methods/crypt.js");

const events = [
  "guildmemberadd"
];

const eventDescription = [
  "- Join: \`guildMemberAdd\`"
];

module.exports = {
  description: "Make the bot send requests to your IFTTT app",
  icon: {
    emoji: "🌐",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/236/globe-with-meridians_1f310.png"
  },
  args: {
    usage: [{
      title: "Register your Webhook key",
      parameters: [
        "key",
        "[Webhook Key]"
      ]
    }, {
      title: "Register for a server event",
      descriptor: `**Events:**\n${eventDescription.join("\n")}`,
      parameters: [
        "register",
        "[Event]"
      ]
    }],
    detectors: [
      /^key|register|unregister/i,
      /^\w+/
    ]
  },
  run,
  parse
}

const actions = {
  key,
  register,
  unregister
};

async function run(pack, {action, ...data}) {
  return actions[action](pack, data);
}

async function key({ cache, channel, member, messageError, messageSuccess }, { webhookKey }) {
  if (!webhookKey) return messageError("You did not provided a webhook key!");
  const encryptedKey = await encrypt(webhookKey);
  
  cache.webhook.set(member.id, {
    webhookKey: encryptedKey,
    events: []
  });
  
  return Promise.all([
    cache.save("webhook"),
    messageSuccess("Successfully set your webhook key!")
  ]);
}

async function register({ cache, channel, member, messageError, messageSuccess }, { event }) {
  const memberWebhook = cache.webhook.get(member.id);
  if (!memberWebhook.webhookKey) return messageError("You have not registered a webhook key yet!");
  
  memberWebhook.events.push(event);
  
  return Promise.all([
    cache.save("webhook"),
    messageSuccess(`You will now receive notifications on \`${event}\` event!`)
  ]);
}

async function unregister({ cache, channel, member, messageError, messageSuccess }, { event }) {
  const memberWebhook = cache.webhook.get(member.id);
  const eventIndex = memberWebhook.events.indexOf(event);
  if (eventIndex === -1) return messageError("You don't have the provided event registered!");
  
  memberWebhook.events.splice(eventIndex, 1 );
 
  return Promise.all([
    cache.save("webhook"),
    messageSuccess(`You will no longer receive notifications on \`${event}\` event!`)
  ]);
}

function parse({ cache, message, channel, member, messageError }, [ rawAction, actionArg ]) {
  message.deletable && message.delete();
  
  if (!rawAction) return messageError("You did not provide the action you want to perform in this command!");
  const action = rawAction.toLowerCase();
  
  if (action === "key") return cache.webhook.has(member.id)
    ? messageError("You have already registered your key!")
    : { action, webhookKey: actionArg };
  
  if (!cache.webhook.has(member.id)) return messageError("You have not registered a webhook key yet!");
  
  const event = actionArg.toLowerCase();
  if (!events.includes(event)) return messageError("You provided an invalid event name!");
  
  const memberEvents = cache.webhook.get(member.id).events;
  if (memberEvents.includes(event)) return messageError("You've already registered for that event!");
  
  return { action, event };
}