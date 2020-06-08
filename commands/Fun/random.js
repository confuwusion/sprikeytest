module.exports = {
  description: "Select a random item from a comma-separated list!",
  icon: {
    emoji: "❔",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/248/white-question-mark_2754.png"
  },
  args: {
    usage: [{
      title: "Select from a comma separated list",
      parameters: [
        "[List]"
      ]
    }],
    detectors: [
      /.+/i
    ]
  },
  parse,
  run
}

async function run({ messageDefault }, { listItems }) {
  const randomIndex = ~~(Math.random() * listItems.length);
  const selectedItem = listItems[randomIndex];
  
  const output = [
    `**${selectedItem}**, I choose you!`,
    `**${selectedItem}** caught my eye!`,
    `**${selectedItem}** doesn't do well in a hide and seek game...`,
    `PPPFFFSSSSHHH! It's **${selectedItem}**. You couldn't select that?`,
    `**${selectedItem}**. Take it or leave it.`,
    `**${selectedItem}**. Easy pick.`,
    `**${selectedItem}** makes my legs tickle...`,
    `It's **${selectedItem}** time!`
  ];
  
  return messageDefault(output[~~(Math.random() * output.length)]);
}

function parse({ messageError }, [ list ]) {
  if (!list) return messageError("You need to provide a comma-separated list for me to select from!");
  
  const listItems = list.split(",");
  if (list.length < 2) return messageError("You need to provide two or more items for me to select from!");
  
  return { listItems };
}