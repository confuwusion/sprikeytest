const { displayBigIntTime } = require("../../methods/displayTime.js");

const disallowCategories = [
  "416081635931324420",
  "695032268850331718",
  "693093644592349315"
];

module.exports = {
  description: "Manage your reminders",
  icon: {
    emoji: "⏰",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/247/alarm-clock_23f0.png"
  },
  args: {
    usage: [{
      title: "Set a reminder",
      descriptor: `▫️Time should be a one or two digit number, followed by h, m or s. Multiple time instances should be ordered.
▫️ If channel is not provided, you will receive a DM.
▫️ If a remind message is not provided, you will be given a random one.`,
      parameters: [
        "set",
        "[Time]",
        "[Channel?]",
        "[Remind Message?]"
      ]
    }, {
      title: "View all your active reminders",
      parameters: [
        "view",
      ]
    }, {
      title: "Remove a reminder",
      descriptor: "Reminder Number is shown before each reminder in the reminder list",
      parameters: [
        "remove",
        "[Reminder Number]"
      ]
    }],
    detectors: [
      /^set|view|remove/i,
      /^(?:\d+[hms])+|\d+/i,
      /^(?:<#)?\d+>?/,
      /^.+/
    ]
  },
  run,
  parse
}

const actions = {
  set,
  view,
  remove
};

async function run(pack, {action, ...data}) {
  return actions[action](pack, data);
}

async function set({ cache, timeManager, channel, author, messageError, messageSuccess }, { memberReminders, providedTime, channelID, remindMessage }) {
  const remindIndex = timeManager.schedule("remind", "fixed", Number(providedTime), {
    userID: author.id,
    channelID,
    remindMessage
  });
  
  if (remindIndex instanceof Error) return messageError(remindIndex.message);
  
  cache.reminders.set(author.id, [ ...memberReminders, remindIndex ]);
  
  return Promise.all([
    cache.save("reminders"),
    messageSuccess(`Successfully set reminder of **${displayBigIntTime(providedTime * 1000000n)}**!`)
      .setFooter("You will be reminded at:", author.displayAvatarURL({ format: "png", dynamic: true }))
      .setTimestamp(Date.now() + Number(providedTime))
  ]);
}

async function view({ cache, timeManager, author, channel, messageDefault }, { memberReminders }) {
  const formattedReminders = memberReminders.map((eventIndex, i) => {
    const eventInstance = timeManager.jobData.get(eventIndex);
    if (!eventInstance) return;
    
    const {
      eventTime,
      eventData: {
        remindMessage
      }
    } = eventInstance;
      
    return `**${i + 1}.** ${displayBigIntTime(BigInt(eventTime - Date.now()) * 1000000n)} from now with message: ${remindMessage || "*Not set;*"}`;
  }).join("\n");
  
  return messageDefault(formattedReminders || "*You have no active reminders*");
}

async function remove({ cache, timeManager, author, channel, messageError, messageSuccess }, { memberReminders, reminderIndex }) {
  const eventJob = timeManager.jobs.get(memberReminders[reminderIndex]);
  if (!eventJob) return messageError("Could not find reminder data! Please contact shark about this.");
  
  await timeManager.unschedule(memberReminders[reminderIndex]);
  
  cache.reminders.set(author.id, [ ...memberReminders.slice(0, reminderIndex), ...memberReminders.slice(reminderIndex + 1) ]);
  
  return Promise.all([
    cache.save("reminders"),
    messageSuccess(`Successfully cancelled reminder!`)
  ]);
}

function parse({ cache, author, channels, command, messageError, pack }, [ rawAction, timeOrIndex, channelTag, remindMessage ]) {
  if (!rawAction) return messageError("You did not provide the action you want to perform in this command!");
  const action = rawAction.toLowerCase();
  
  const memberReminders = cache.reminders.get(author.id) || [];
  
  if (action === "view") return { action, memberReminders };
  if (action == "remove") {
    const reminderIndex = parseInt(timeOrIndex, 10) - 1;
    console.log(timeOrIndex, reminderIndex);
    if (isNaN(reminderIndex)) return messageError("You provided an invalid reminder number!");
    
    if (!memberReminders[reminderIndex]) return messageError("A reminder on that number does not exist!");
    
    return { action, reminderIndex, memberReminders };
  }
  
  const [, hr = 0, min = 0, sec = 0] = timeOrIndex.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i) || [];
  
  if (!hr && !min && !sec) return messageError("You provided an invalid reminder time!");
  
  const providedTime = BigInt(hr) * 3600000n + BigInt(min) * 60000n + BigInt(sec) * 1000n;
  
  const [, channelID = ""] = channelTag.match(/(?:<#)?(\d+)>?/) || [];
  
  if (channelID) {
    const selectedChannel = channels.cache.get(channelID);
    if (!selectedChannel) return messageError("You provided an invalid reminder channel!");
    
    if (!command.hasPermission({ ...pack, cache, channel: selectedChannel }) || disallowCategories.includes(selectedChannel.parentID)) return messageError("You cannot set a reminder in the provided channel!");
  }
  
  return { action, memberReminders, providedTime, channelID, remindMessage };
}