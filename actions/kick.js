const { replacer } = require("../methods/actionMessage.js");

module.exports = {
  description: "Kicks a member from the guild",
  usage: "<[Reason]>",
  perform,
  parse
};
  
function perform({ botActions, member, message }, [ reason ], replacerOptions) {
  if (!member.kickable) return botActions.emit("log", ["client", "Kick Action Error", `Could not kick member ${member.displayName} (ID: ${member.id})!`], message);
  
  return member.kick(replacer(message, reason, replacerOptions));
}

function parse([ reasonInput ]) {
  const reason = reasonInput || "As requested by an integrated action.";
  
  return [ reason ];
}