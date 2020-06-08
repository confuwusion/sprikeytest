const argError = require("../methods/argError.js")("Notify");
const { replacer } = require("../methods/actionMessage.js");

module.exports = {
  description: "Deletes the target message, with a reason that gets logged to Audit Logs",
  usage: "<[Delete Reason]>;",
  perform,
  parse
};
  
function perform({ message }, [ deleteReason ], replacerOptions) {
  if (message.deleted || !message.deletable) return;
  return message.delete({
    reason: replacer(message, deleteReason, replacerOptions)
  });
}

function parse([ deleteReason ]) {
  if (!deleteReason) return argError("You did not provide a Delete reason!");
  return [ deleteReason ];
}