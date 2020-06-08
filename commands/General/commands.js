module.exports = {
  description: "View category commands",
  icon: {
    emoji: "🔡",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/236/input-symbol-for-latin-small-letters_1f521.png"
  },
  args: {
    usage: [{
      title: "View all commands in a Category",
      parameters: [
        "[Category Name]"
      ]
    }],
    detectors: [
      /^\w+/
    ]
  },
  parse,
  run
}

async function run({ messageDefault }, { categoryName, category }) {
  const categoryCommands = Object.entries(category)
    .map(([commandName, {icon : {emoji}, description}]) => `${emoji} \`$${commandName}\`: ${description}`)
    .join("\n");
  
  return messageDefault(categoryCommands)
    .author.name = `${categoryName} Commands`;
}

function parse({ client, categories, messageError }, [ rawCategoryName ]) {
  if (!rawCategoryName) return messageError("You need to provide the name of the category to view its commands!");
  
  const categoryName = `${rawCategoryName[0].toUpperCase()}${rawCategoryName.slice(1).toLowerCase()}`;
  
  const category = categories.get(categoryName);
  if (!category) return messageError(`A category by name **${categoryName}** does not exist!`);
  
  return { categoryName, category };
}