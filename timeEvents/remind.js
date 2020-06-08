const { displayBigIntTime } = require("../methods/displayTime.js");

const remindQuotes = [
  "The ground rumbles as you remember what you wanted to do",
  "Echos of dragons deep in the pits remind you what you wanted to do",
  "Out in the morning light, the sun shone brightly - which reminded you what you wanted to do",
  "As you spend time thinking about life, you are reminded what you wanted to do",
  "Gazing at the starry sky, the constellations form to remind you want you wanted to do",
  "You were running your hand across your golden trophy when you noticed your reflecting and remembered what you wanted to do",
  "The wind whispers in your ear to remind you of what you had forgotten"
];

module.exports = async function({ client, cache, users }, eventIndex, {
  userID,
  remindMessage,
  channelID
}, { isLate, inactivityGap }) {
  const user = users.cache.get(userID);
  const remindChannel = channelID ?
    client.channels.cache.get(channelID) :
    await user.createDM();
  
  const userReminders = cache.reminders.get(user.id);
  const reminderIndex = userReminders.indexOf(eventIndex);
  cache.reminders.set(user.id, [ ...userReminders.slice(0, reminderIndex), ...userReminders.slice(reminderIndex + 1) ]);

  return Promise.all([
    cache.save("reminders"),
    remindChannel.send({
      content: `<@${userID}>, your reminder time is up!`,
      embed: {
        author: {
          name: user.tag,
          icon_url: user.displayAvatarURL({ format: "png", dynamic: true })
        },
        title: "Reminder",
        description: remindMessage ||
          remindQuotes[~~(Math.random() * remindQuotes.length)],
        footer: {
          text: isLate ? `Sorry for being ${displayBigIntTime(BigInt(inactivityGap) * 1000000n)} late!` : ""
        }
      }
    })
  ]);
}