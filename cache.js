const { ArtPrompt } = require("./structures/ArtPrompt.js");
const { CacheArray } = require("./structures/CacheArray.js");
const { CacheMap } = require("./structures/CacheMap.js");
const { Cache } = require("./structures/Cache.js");
const { IncrementedStorage } = require("./structures/IncrementedStorage.js");
const { PermissionsManager } = require("./structures/PermissionsManager.js");
const { Watcher } = require("./structures/Watcher.js");
const { WordCensor } = require("./structures/WordCensor.js");

const { MASTER_ID, ROCKHO_ID } = require("./constants.js");

module.exports = function(client, database) {
  const loadCache = {
    test: {
      dataClass: IncrementedStorage
    },
    actionData: {
      dataClass: IncrementedStorage
    },
    artPrompts: {
      dataClass: ArtPrompt
    },
    botLastActive: {
      dataClass: Number,
      generateDefaults: (cache, num) => num || Date.now()
    },
    characterDictionary: {
      dataClass: CacheMap
    },
    jobData: {
      dataClass: IncrementedStorage
    },
    leaveRoles: {
      dataClass: CacheMap
    },
    lockout: {
      dataClass: CacheMap
    },
    logChannels: {
      dataClass: CacheMap
    },
    pingRecord: {
      dataClass: Object
    },
    reactionRoles: {
      dataClass: CacheMap
    },
    reminders: {
      dataClass: CacheMap
    },
    restartMessage: {
      dataClass: Object
    },
    subcommands: {
      dataClass: CacheMap
    },
    watchPatterns: {
      dataClass: Watcher
    },
    webhook: {
      dataClass: CacheMap
    },
    wordCensor: {
      dataClass: WordCensor
    },
    memberPermissions: {
      dataClass: PermissionsManager,
      async generateDefaults(cache, memberPermissions) {
        const loading = [];
        
        const mods = new Set([
          ...cache.roles.mainMod.members.keys(),
          ...cache.roles.testMod.members.keys()
        ]);
        const admins = new Set([
          ...cache.roles.mainAdmin.members.keys(),
          ...cache.roles.testAdmin.members.keys()
        ]);
        
        // Bot Master
        if (!memberPermissions.has(MASTER_ID)) {
          loading.push(memberPermissions.set(MASTER_ID, {
            baseHierarchy: 1,
            commandHierarchies: {}
          }));
        }
        
        // Server Owner
        if (!memberPermissions.has(ROCKHO_ID)) {
          loading.push(memberPermissions.set(ROCKHO_ID, {
            baseHierarchy: 2,
            commandHierarchies: {}
          }));
        }
        
        // Admin
        for (const adminID of admins.keys()) {
          if (memberPermissions.has(adminID)) continue;
          loading.push(memberPermissions.set(adminID, {
            baseHierarchy: 3,
            commandHierarchies: {}
          }));
        }
        
        // Mod
        for (const modID of mods.keys()) {
          if (memberPermissions.has(modID)) continue;
          loading.push(memberPermissions.set(modID, {
            baseHierarchy: 4,
            commandHierarchies: {}
          }));
        }
        
        await Promise.all(loading);
        return memberPermissions;
      }
    }
  };
  
  return new Cache(client, database, loadCache);
}