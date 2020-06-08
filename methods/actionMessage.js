function replacer(message, replacingStr, replaceOptions) {
  const replacedStr = Object.entries({
    ...replaceOptions,
    memberTag: message.author.tag,
    memberID: message.author.id,
    channelTag: `<#${message.channel.id}>`
  }).reduce((str, [ property, value ]) => str.replace(new RegExp(`\\{${property}\\}`, "ig"), value), replacingStr);
  
  return replacedStr;
}

module.exports = { replacer };