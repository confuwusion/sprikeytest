const PLACEHOLDER_REGEX = {
  l: /\{(noun|adjective)-((?:\d+,?)+)\}/i,
  g: /\{(noun|adjective)-((?:\d+,?)+)\}/gi
};

/* NOUNS
Common Name
 - Colors
 - Feelings
 - Weather
 - 
Common Place
Common Animal
Common Thing
Proper Name
Proper Place
Proper Thing
*/

/* ADJECTIVES
Quantity
Opinion
Size
Shape
Age
Color
Origin
Material
*/

/* ADVERBS
Intensify
Downtone
Frequency
Manner
*/

/* Proposition
Time
Place
Direction
*/

class ArtPrompt {
  constructor({ adjectives, categories = [] } = {}, cache) {
    this.adjectives = adjectives || [];
    this.categories = new Map(
      Array.from(categories)
        .map(([ categoryName, category ]) => 
          [ categoryName, new PromptCategory(categoryName, category || {}, adjectives, cache) ]
        )
    );
    Object.defineProperty(this, "cache", { value: cache });
  }
  
  addCategory(name) {
    if (this.categories.has(name)) return new Error(`Category by name **${name}** already exists!`);
    
    return [
      this.categories.set(name, new PromptCategory(name)),
      this.cache.save("artPrompts")
    ];
  }
  
  removeCategory(name) {
    return [
      this.categories.delete(name),
      this.cache.save("artPrompts")
    ];
  }
  
  addAdjective(adjective) {
    if (this.adjectives.includes(adjective)) return new Error(`The adjective **${adjective}** is already registered!`);
    
    this.adjectives.push(adjective);
    return [
      this.adjectives.length - 1,
      this.cache.save("artPrompts")
    ];
  }
  
  removeAdjective(adjective) {
    const adjectiveIndex = this.adjectives.indexOf(adjective);
    if (adjectiveIndex < 0) return new Error(`An adjective by name **${adjective}** does not exist!`);
    
    return [
      this.adjectives.splice(adjectiveIndex, 1),
      this.cache.save("artPrompts")
    ];
  }
}

class PromptCategory {
  constructor(name, { nouns, templates } = {}, adjectives, cache) {
    this.name = name;
    this.nouns = nouns || [];
    this.templates = templates || [];
    Object.defineProperty(this, "adjectives", { value: adjectives });
    
    Object.defineProperty(this, "cache", { value: cache });
  }

  generate(skipTemplates = []) {
    const selectedTemplates = this.templates
      .map((template, i) => !skipTemplates.includes(i) && [ i, template ])
      .filter(Boolean);
    const templateIndex = ~~(Math.random() * selectedTemplates.length);
    const [ originalIndex, selectedTemplate ] = selectedTemplates[templateIndex] || [];
    
    if (!selectedTemplate) return new Error("You have completed all prompts of this category, time to move on to the next category!");

    const { nouns, adjectives } = selectedTemplate;
    
    const selectedNouns = [ ...this.nouns ]
      .sort(() => 0.5 - Math.random());
    
    const selectedAdjectives = [ ...this.adjectives ]
      .sort(() => 0.5 - Math.random());

    const promptPieces = selectedTemplate.pieces.map(piece => {
      if (typeof piece === "string") return piece;

      const { figure, refers } = piece;
      const refer = refers[~~(Math.random() * refers.length)];
      
      return figure === "noun"
        ? selectedNouns[refer]
        : selectedAdjectives[refer];
    });
    
    return [
      promptPieces.join(""),
      originalIndex
    ];
  }
  
  addNoun(noun) {
    if (this.nouns.includes(noun)) return new Error(`The noun by name **${noun}** is already registered!`);
    this.nouns.push(noun);
    
    return [
      this.nouns.length - 1,
      this.cache.save("artPrompts")
    ];
  }
  
  addTemplate(template) {
    const parsedTemplate = this.parseTemplate(template);
    if (parsedTemplate instanceof Error) return parsedTemplate;
    
    this.templates.push(parsedTemplate);
    return [
      this.templates.length - 1,
      this.cache.save("artPrompts")
    ];
  }

  parseTemplate(template) {
    const placeholderTags = template.match(PLACEHOLDER_REGEX.g) || [];
    
    const {
      placeholders, sequence,
      adjectives, nouns
    } = placeholderTags.reduce(
      (data, placeholderTag) => {
        const placeholder = new Placeholder(placeholderTag);
        data.placeholders.push(placeholder);

        const { figure, refers } = placeholder;
        
        const sequenceIndex = figure.length % 4;
        const unsequenced = refers.filter(refer => !data.sequence[sequenceIndex][refer - 1]);
        if (!unsequenced.length) return data;

        unsequenced.forEach(refer => data.sequence[sequenceIndex][refer - 1] = 1);

        data[`${figure}s`] += unsequenced.length;

        return data;
      },
      {
        placeholders: [],
        sequence: [[], []],
        adjectives: 0,
        nouns: 0
      }
    );
    
    if (this.nouns.length < nouns) return new Error(`There need to be **${nouns - this.nouns.length} more nouns** in order to register this prompt template!`);
    if (this.adjectives.length < adjectives) return new Error(`There need to be **${adjectives - this.adjectives.length} more adjectives** in order to register this prompt!`);

    const sequenceSwap = sequence.map((seq, i) => seq ? 0 : i);
    const missingPlaceholders = sequenceSwap.filter(Boolean);
    
    if (missingPlaceholders.length)
      return new Error(
        `Placeholder numbers **${missingPlaceholders.join(", ")}** are missing!`
      );

    const splitCode = process.hrtime.bigint().toString(36);
    const templateTextPieces = template
      .replace(PLACEHOLDER_REGEX.g, splitCode)
      .split(splitCode);

    const pieces = new Array(templateTextPieces.length + placeholders.length)
      .fill(1)
      .map((nul, i) =>
        i % 2 ? placeholders.shift() : templateTextPieces.shift()
      )
      .filter(Boolean);

    return { pieces, nouns, adjectives };
  }
}

class Placeholder {
  constructor(placeholder) {
    const [, figure, refers] = placeholder.match(PLACEHOLDER_REGEX.l) || [];

    this.figure = figure.toLowerCase();
    this.refers = refers
      .split(",")
      .map(refer => parseInt(refer.trim(), 10));
  }
}

module.exports = {
  ArtPrompt,
  PromptCategory
};