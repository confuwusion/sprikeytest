module.exports = async function({ cache }, message) {
  const reactionRole = cache.reactionRoles.get(message.id);
  if (!reactionRole) return;

  cache.reactionRoles.delete(message.id);
  cache.save("reactionRoles");
}