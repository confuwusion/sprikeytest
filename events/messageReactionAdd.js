module.exports = async function({ botActions, cache }, rawReaction, user) {
  const reaction = rawReaction.partial ? await rawReaction.fetch() : rawReaction;
  if (!reaction) return;

  if (user.bot ||
    cache[`reactionRoleCooldown-${reaction.message.id}-${user.id}`] > Date.now()) return;

  const { message } = reaction;
  const { members, roles } = message.guild;

  // If message is not a a reaction role message
  const reactionRolesData = cache.reactionRoles.get(message.id);
  if (!reactionRolesData) return;
  
  const { reactionRoles } = reactionRolesData;
  // Find reaction role
  const reactionRole = reactionRoles.find(({ name }) => name === reaction.emoji.name);
  // Non reaction role reaction
  if (!reactionRole) return;

  const { roleID } = reactionRole;
  const role = roles.resolve(roleID) ||
    await roles.fetch(roleID);
  if (!role) return botActions.emit("log", ["client", "Reaction Role Notice", `The role by ID \`${roleID}\` does not exist!`], message);

  const rawMember = members.resolve(user);
  if (!rawMember) return;
  const member = rawMember.partial
  ? await rawMember.fetch()
  : rawMember;

  if (member.roles.cache.has(roleID)) return;

  const [dmChannel] = await Promise.all([
    user.createDM(),
    member.roles.add([role])
  ]);

  cache[`reactionRoleCooldown-${message.id}-${user.id}`] = Date.now() + 1001;

  return dmChannel.send(`➡️ I have assigned the **${role.name}** role to you!`);

}