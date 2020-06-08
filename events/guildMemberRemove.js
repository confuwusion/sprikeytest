const { COMMUNIMATE_ID } = require("../constants.js");

module.exports = async function({ cache }, member) {
  if (member.guild.id !== COMMUNIMATE_ID) return;
  
  const memberRoleIDs = Array.from(member.roles.cache.keys())
    .filter(roleID => roleID !== COMMUNIMATE_ID);
  
  cache.leaveRoles.set(member.id, memberRoleIDs);
  return cache.save("leaveRoles");
};