module.exports = async function({ botActions, cache, }, rawReaction, user) {
  const reaction = rawReaction.partial ? await rawReaction.fetch() : rawReaction;
  if (!reaction) return;

  if (user.bot || cache[`reactionRoleCooldown-${reaction.message.id}-${user.id}`] > Date.now()) return;
  
  const { message } = reaction;
  const { members, roles } = message.guild;

  const reactionRolesData = cache.reactionRoles.get(message.id);
  if (!reactionRolesData) return;
  
  const { reactionRoles } = reactionRolesData;
  const reactionRole = reactionRoles.find(({ name }) => name === reaction.emoji.name);
  if (!reactionRole) return;

  const { roleID } = reactionRole;
  const role = roles.cache.get(roleID);
  if (!role) return botActions.emit("log", [`The role by ID \`${roleID}\` does not exist!`, "client", "Reaction Role Notice"]);

  const rawMember = members.resolve(user);
  if (!rawMember) return;
  const member = rawMember.partial
  ? await rawMember.fetch()
  : rawMember;
  
  if (!member.roles.cache.has(roleID)) return;

  const [dmChannel] = await Promise.all([
    user.createDM(),
    member.roles.remove([role])
  ]);

  cache[`reactionRoleCooldown-${message.id}-${user.id}`] = Date.now() + 1001;

  return dmChannel.send(`⬅️ I have removed the **${role.name}** role from you!`);
}