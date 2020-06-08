function actionError(name, err) {
  return new Error(`Action Error (${name}): ${err}!`);
}

class Action {
  constructor(name, {
    description,
    usage,
    perform,
    parse
  }) {
    if (!description) return actionError(name, "description is not defined");
    if (!perform) return actionError(name, "main method perform is not defined");
    if (!parse) return actionError(name, "method parse is not defined");
    
    this.name = name;
    this.description = description;
    this.usage = usage;
    this.perform = perform;
    this.parse = parse;
  }
}

module.exports = { Action };