const { MessageEmbed } = require("discord.js");
const S = require("string");

const {
  ALLOW, DENY,
  commandChannels,
  PERMISSIONS: {
    HIERARCHIES: { MASTER, MOD, EVERYONE }, 
    TRENDS: { CURRENT_BELOW, CURRENT_ONLY, CURRENT_ABOVE }
  }
} = require(`../constants.js`);
const INPUT_CAPTURE = /\{\[inp\]\}/g

const categoryHierarchies = {
  // Art: EVERYONE,
  General: EVERYONE,
  Fun: EVERYONE,
  Utility: EVERYONE,
  Moderation: MOD,
  Master: MASTER,
  Watcher: MOD
};

function commandError(name, err) {
  return new Error(`Command Error (${name}): ${err}!`);
}

class Command {
  constructor({
    name, description, category, run, parse,
    inherits = null,
    icon: { emoji, url },
    args: {
      blank = "",
      details = "",
      fillers = [],
      usage = [],
      detectors = []
    },
    permission: {
      exclusive = false,
      channels = commandChannels,
      hierarchy = categoryHierarchies[category],
      trend = CURRENT_ABOVE
    } = {}
  }) {
    if (!run) throw commandError(name, "Main method run is not defined");
    if (!name) throw commandError("Unknown Command", "name is not defined");
    if (!description) throw commandError(name, "description is not defined");
    if (!category) throw commandError(name, "category is not defined");
    if (!emoji) throw commandError(name, "icon emoji is not defined");
    if (!url) throw commandError(name, "icon url is not defined");
    if (!(blank.length || usage.length)) throw commandError(name, "Command Usage details are not defined");
    if (!usage.length !== !detectors.length) throw commandError(name, "Parameters do not correspond with Command Usage");
    
    this.name = name;
    this.description = description;
    this.category = category;
    this.inherits = inherits;
    this.icon = { emoji, url };
    this.args = { blank, details, fillers, detectors, usage };
    this.permission = { exclusive, channels, hierarchy, trend };
    this.run = run;
    if (parse) this.parse = parse;
  }
  
  hasPermission({ cache, channel, author }) {
    const { memberPermissions } = cache;
    
    const { exclusive, channels, hierarchy, trend } = this.permission;
    
    const memberHierarchy = memberPermissions.forCommand(this.name, author.id);
    console.log("▫️Command:", this.name);
    console.log("Member:", author.username);
    console.log("Member Hierarchy:", memberHierarchy);
    console.log("Belongs to channel:", channels.includes(channel.id));
    console.log("Exclusive to channel:", exclusive);
    
    // Command's usability in message channel
    if (!channels.includes(channel.id)) {
      const isStaff = memberPermissions.compare(MOD, CURRENT_ABOVE, memberHierarchy);
      console.log("Is staff:", isStaff);
      // Do not allow if command is not exclusive to channels or if member is not staff
      if ((exclusive || !isStaff) && channel.guild) return DENY;
    }
    
    // Member Command usability
    const commandUsable = memberPermissions.compare(hierarchy, trend, memberHierarchy);
    console.log("Command Hierarchy and Trend:", hierarchy, trend);
    console.log("Command is usable:", commandUsable);
    return commandUsable;
  }
  
  createSub({ name, hierarchy, trend, exclusive, channels, fillers }) {
    return new Command({
      ...this,
      name,
      inherits: this.name,
      permission: {
        ...this.permission,
        hierarchy, trend, exclusive,
        channels: channels.length ? channels : this.permission.channels
      },
      args: {
        ...this.args,
        fillers
      }
    });
  }
  
  embedTemplate() {
    return new MessageEmbed()
      .setAuthor(S(this.name).capitalize().s, this.icon.url);
  }

  extractArgs(content) {
    const {
      args: { detectors, fillers = [] }
    } = this;
  
    if (!detectors.length) return detectors;
  
    let remaining = content;
  
    return detectors.map((detector, i) => {
      // Filler is a potentially pre-prepared
      // argument string for a command parameter
      // that might accept user input at
      // specified parts - wherever {[inp]} is
      // found
    
      // If filler doesn't contain user input tag,
      // it means it is not accepting user input
      // for that parameter
    
      // There can only be one set of input
      // per filler
      const filler = fillers[i] || "{[inp]}";
    
      // Global regex is first given the non-global
      // behaviour (to extract text linearly) and
      // then use the global regex on the
      // non-globally extracted text
    
      // This logic is used to:
      // - Prevent global regex from extracting
      //   text from elsewhere
      // - Identify the true capture length so that
      //   the captured part can be cut out properly
    
      // Making global regex linear
      const captureRegex = detector.global
        ? new RegExp(`^((?:(?:${detector.source})\\s*)+)`)
        : detector;
      
      
      // Capture user input and place it on every
      // user input tag to complete the argument
      const userCapture = (remaining.match(captureRegex) || [""])[0].replace(/\$&/g, "\\$\\&");
      const completeArg = filler.replace(INPUT_CAPTURE, userCapture).trim();
      
      // Use the original regex on the completed
      // argument to produce expected behaviour,
      // thus expected output
      const wholeCapture = completeArg.match(detector)|| [""];
      
      // Take out the captured part from user input
      // If nothing was captured, then this will
      // slice to return the same string
      remaining = remaining.slice(userCapture.length).trim();
      return wholeCapture && !detector.global
        ? wholeCapture[0]
        : wholeCapture;
    });
  }
  
  parse() {
    return {};
  }
}

module.exports = { Command };