const request = require("request");
const { decrypt } = require("../methods/crypt.js");

const { COMMUNIMATE_ID } = require("../constants.js");

module.exports = async function(pack, member) {
  return Promise.all([
    assignLeaveRoles(pack, member),
    joinNotification(pack, member)
  ]);
};

async function joinNotification({ cache }, member) {
  if (member.guild.id !== COMMUNIMATE_ID) return;
  
  const { members } = member.guild;

  const notifyMembers = Array.from(cache.webhook.entries()).filter(
    ([memberID, memberWebhook]) =>
      members.cache.has(memberID) &&
      memberWebhook.events.includes("guildmemberadd")
  );

  for (const [, { webhookKey }] of notifyMembers) {
    const decryptedKey = await decrypt(webhookKey);

    request.post({
      url: `https://maker.ifttt.com/trigger/sprikey_notifications/with/key/${decryptedKey}`,
      form: {
        value1: "New Member Join",
        value2: `A new member ${member.user.tag} has joined the server!`,
        value3: member.user.displayAvatarURL({
          format: "png"
        })
      }
    });
  }
}

async function assignLeaveRoles({ cache }, member) {
  const allLeaveRoleIDs = cache.leaveRoles.get(member.id);
  if (!allLeaveRoleIDs) return;
  
  const { me, roles } = member.guild;
  
  const leaveRolePromises = allLeaveRoleIDs
    .map(async leaveRoleID => {
      const rawLeaveRole = roles.cache.get(leaveRoleID);
      if (roles.cache.has(rawLeaveRole)) return;
      
      const leaveRole = rawLeaveRole.partial
        ? await rawLeaveRole.fetch()
        : rawLeaveRole;
      
      const myHighestRole = me.roles.highest;
      if (leaveRole.managed || leaveRole.rawPosition >= myHighestRole.rawPosition) return;
      
      return leaveRole;
    });
  
  const leaveRoles = (await Promise.all(leaveRolePromises)).filter(Boolean);
  if (!leaveRoles.length) return;
  
  cache.leaveRoles.delete(member.id);
  
  return member.roles.add(leaveRoles);
}