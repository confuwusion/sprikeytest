module.exports = {
  description: "View the bot's ping!",
  icon: {
    emoji: "🏓",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/236/table-tennis-paddle-and-ball_1f3d3.png"
  },
  args: {
    blank: "to view the boy's ping"
  },
  run,
  parse
};

function parse() {return {}}

function toUnit(time) {
  const s = Math.floor(time % 60000 / 1000);
  const ms = Math.floor(time % 60000 % 1000);
  const sDisplay = s > 0 ? `${s}s, ` : ""
  const msDisplay = ms > 0 ? `${ms}ms` : "";
  
  return (sDisplay + msDisplay);
}

async function run({ client, cache, channel, messageDefault, pack }, content) {
    
  const pingRecord = cache.pingRecord;
  
  if (/record/i.test(content)) return channel.send(`${client.users.get(pingRecord.user).username} holds the record for the fastest reaction time of ${toUnit(pingRecord.reactionTime)}!`);
  
  const pingMsg = await channel.send(messageDefault('Ping?'));
  pack.default = null;
  
  channel.awaitMessages(m => !m.author.bot, {
    max: 1,
    time: 10000,
    errors: ['time']
  }).then(collected => {
    if (pingMsg.deleted) return;
    
    const immediateMsg = collected.first();
    const timeTaken = immediateMsg.createdTimestamp - pingMsg.createdTimestamp;
    
    // Update ping data
    pingMsg.edit("", {embed: messageDefault(`Pong! \`${Math.round(client.ws.ping)} ms\``)
      .setFooter(`${(pingRecord.reactionTime || Infinity) > timeTaken ? '👑 ' : ''}${immediateMsg.author.tag} in ${toUnit(timeTaken)}!`, immediateMsg.author.displayAvatarURL({ format: "png", dynamic: true }))
    });
    pack.default = null;
    
    if ((pingRecord.reactionTime || Infinity) > timeTaken) cache.pingRecord = {
      reactionTime: timeTaken,
      user: immediateMsg.author.id
    };
    
    return cache.save("pingRecord");
    
  }).catch(collected => {
    pingMsg.deleted && pingMsg.edit("", {embed: {
      title: 'Ping',
      description: `Pong! \`\`${Math.round(client.ws.ping)} ms\`\``,
      color: 5865983
    }});
  });
}