const got = require("got");
const { Benchmark } = require("./Benchmark.js");
const { createCanvas, loadImage, Image } = require("canvas");

const PAGE_MARGIN = 5;

const CARD_WIDTH = 500;
const CARD_HEIGHT = 84;
const CARD_CENTRE = {
  top: CARD_HEIGHT / 2,
  left: CARD_WIDTH / 2
};
const CARD_PADDING = 20;
const CARD_SPACING = 15;
const CARD_BACKGROUND = "#2F3136";

const DEFAULT_COLOR = "#72767D";

const CIRCLE_RADIANS = Math.PI * 2;

const RANK_SIZE = 32;
const RANK_RADIUS = RANK_SIZE / 2;

const AVATAR_SIZE = 64;
const AVATAR_RADIUS = AVATAR_SIZE / 2;

const TOP_TEXT_Y = 32;

const options = {
	prefixUrl: "https://mee6.xyz/api/plugins/levels/leaderboard/",
	responseType: "json"
};

class Mee6API {
  constructor(MAIN_GUILD) {
    this.MAIN_GUILD = MAIN_GUILD;
    this.GUILD_ID = MAIN_GUILD.id;
    
    this.roleRewards = [];
    this.leaderboards = new Map();
    this.memberRankData = new Map();
    this.memberAvatarCache = new Map();
    this.renderTimeCache = [];
    
    //this.loadedAvatars = this.loadAllAvatars();
    this.gotCache = new Map();
  }
  
  async loadAllAvatars() {
    const avatarCache = this.memberAvatarCache;
    
    return Promise.all(this.MAIN_GUILD.members.cache.map(async member => {
      if (avatarCache.has(member.id)) return;
      
      const memberAvatarURL = member.user.displayAvatarURL({ format: "png" });
      const imageBuffer = await got(`${memberAvatarURL}?size=64`).buffer().catch(() => null);
      avatarCache.set(member.id, imageBuffer);
      
      return imageBuffer;
    }));
  }
  
	getID(guildOrUser) {
		if (typeof guildOrUser === "string") return guildOrUser;
		else if (typeof guildOrUser.id === "string") return guildOrUser.id;
		else throw new Error("Invalid Id specified.");
	}
  
	async getRoleRewards() {
		const { GUILD_ID } = this;
		const {
      body: { role_rewards } 
    } = await got.get(`${GUILD_ID}?limit=1`, options);
    
		return this.roleRewards = role_rewards
      .sort((a, b) => a.rank - b.rank)
      .map(({ rank, ...rest }) => ({ ...rest, level: rank }));
	}
  
	async getLeaderboardEntries(page = 1, limit = 1000, resolveImage = false) {
    const classThis = this;
		const { GUILD_ID } = this;
		const {
      body: { players } 
    } = await got.get(`${GUILD_ID}?limit=${limit}&page=${page - 1}`, options);
    
		return players.map((user, index) => {
			const { id, level, username, discriminator, avatar } = user;
			const avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}`;
      const avatarRequestData = this.memberAvatarCache.has(id)
        ? this.memberAvatarCache.get(id)
        : got(`${avatarUrl}?size=64`);
      const avatarData = this.memberAvatarCache.has(id)
        ? avatarRequestData
        : avatarRequestData.buffer()
            .then(imageBuffer => {
              const imageDataURL = `data:image/png;base64,${imageBuffer.toString("base64")}`;
          
              classThis.memberAvatarCache.set(id, imageDataURL)
              return imageDataURL;
            })
            .catch(() => null);
			
      const [ userXP, levelXP, totalXP ] = user.detailed_xp;
			const memberRankData = {
				id, level, username, discriminator, avatarUrl, avatarData, avatarRequestData,
				tag: `${username}#${discriminator}`,
				xp: { userXP, levelXP, totalXP },
				rank: (limit * (page - 1)) + index + 1
			};
      
      this.memberRankData.set(id, memberRankData);
      return memberRankData;
		});
	}

  async getLeaderboard() {
		const leaderboard = [];
    
		let pageNumber = 0;
    let page;
		do {
			page = await this.getLeaderboardEntries(pageNumber, 1000);
			leaderboard.push(...page);
			pageNumber += 1;
		} while (page.length < 1000);
    
		return leaderboard;
	}

	static async getUserXP(user) {
		const userId = this.getId(user);
		let pageNumber = 0;
    let page;
    let userInfo;
		do {
			page = await this.getLeaderboardPage(1000, pageNumber);
			userInfo = page.find(u => u.id === userId);
			if (page.length < 1000 || userInfo) break;
			pageNumber += 1;
		} while (page.length < 1000 || userInfo);
		return userInfo;
	}
  
  async renderLeaderboard(page = 1) {
    const classThis = this;
    const [ selectedMembers, previousMember ] = await Promise.all([
      this.getLeaderboardEntries(page, 10, true),
      page - 1 && this.getLeaderboardEntries((page - 1) * 10, 1, true)
    ]);
    
    const canvasBench = new Benchmark(true);
    const canvas = createCanvas((PAGE_MARGIN * 2) + CARD_WIDTH, (PAGE_MARGIN * 2) + (CARD_HEIGHT * selectedMembers.length));
    const ctx = canvas.getContext("2d");
    canvasBench.stop();
    this.canvasBench = canvasBench.display();
    const cardBenches = [];
    
    // To clear all styles
    ctx.save();
    
    ctx.fillStyle = "#18191C";
    ctx.fillRect(0, 0, (PAGE_MARGIN * 2) + CARD_WIDTH, (PAGE_MARGIN * 2) + (CARD_HEIGHT * selectedMembers.length));
    
    ctx.restore();
    this.imageBenches = [];
    await selectedMembers.reduce(async (acc, member, memberIndex, members) => {
      const syncCTX = await acc;
      
      const pageX = PAGE_MARGIN;
      const pageY = PAGE_MARGIN + (memberIndex * CARD_HEIGHT);
      
      const cardBench = new Benchmark(true);
      await classThis.renderMember(member, members[memberIndex - 1] || (previousMember && previousMember[0]), syncCTX, pageX, pageY);
      cardBench.stop();
      cardBenches.push(cardBench.display());
      
      return syncCTX;
    }, new Promise(res => res(ctx)));
    
    this.renderTimeCache = cardBenches;
    
    return canvas;
  }
  
  async renderMember(member, prevMember, ctx, pageX, pageY) {
    // Card Background
    ctx.fillStyle = CARD_BACKGROUND;
    ctx.fillRect(pageX, pageY, CARD_WIDTH, CARD_HEIGHT);
    ctx.save();

    ctx.fillStyle = DEFAULT_COLOR;

    // Rank circle
    ctx.beginPath()
    const rankCentre = pageX + CARD_PADDING + RANK_RADIUS;
    ctx.arc(rankCentre, pageY + CARD_CENTRE.top, RANK_RADIUS, 0, CIRCLE_RADIANS, false);
    ctx.fill();
    ctx.closePath();
    
    // Avatar circle
    ctx.beginPath();
    const avatarCentre = rankCentre + RANK_RADIUS + AVATAR_RADIUS + CARD_SPACING;
    ctx.arc(avatarCentre, pageY + CARD_CENTRE.top, AVATAR_RADIUS, 0, CIRCLE_RADIANS, false);

    ctx.clip();
    
    const avatarBench = new Benchmark(true);
    const memberAvatarURL = await member.avatarData;
    
    if (memberAvatarURL) {
      const memberAvatar = new Image(64, 64);
      memberAvatar.src = memberAvatarURL;
      ctx.drawImage(memberAvatar, avatarCentre - AVATAR_RADIUS, pageY + 10);
    }
    avatarBench.stop();
    
    this.imageBenches.push([ avatarBench.display() ]);
    
    ctx.closePath();
    ctx.restore();

    ctx.beginPath();
    ctx.fillStyle = CARD_BACKGROUND;
    ctx.font = "bold 18px sans-serif";
    
    // Member rank text
    const rankText = member.rank.toString();
    const rankTextOffset = ctx.measureText(rankText).width / 2;
    ctx.fillText(rankText, rankCentre - rankTextOffset, pageY + CARD_CENTRE.top + (14 / 2));
    
    // Member tag text
    ctx.fillStyle = "#cccccc";
    ctx.font = "18px sans-serif";
    const tagX = avatarCentre + AVATAR_RADIUS + CARD_SPACING;
    ctx.fillText(member.tag, tagX, pageY + TOP_TEXT_Y);
    
    // Level text
    const levelText = member.level.toString();
    const levelWidth = ctx.measureText(levelText).width;
    const levelX = pageX + CARD_WIDTH - CARD_PADDING - levelWidth;
    ctx.fillText(levelText, levelX, pageY + TOP_TEXT_Y);
    
    // "LEVEL" label
    ctx.font = "12px sans-serif";
    const levelTextWidth = ctx.measureText("LEVEL").width;
    ctx.fillText("LEVEL", levelX - levelTextWidth, pageY + TOP_TEXT_Y);
    
    // "RANK UP:" label
    const rankupWidth = ctx.measureText("RANK UP: ").width;
    ctx.fillText("RANK UP: ", tagX, pageY + 64);
    // Rank up text
    ctx.fillText(`${prevMember && prevMember.xp
      ? `${prevMember.xp.totalXP - member.xp.totalXP} POINTS`
      : "You are first!"
    }`, tagX + rankupWidth, pageY + 64);
    
    // Current XP text
    const xpText = `${member.xp.userXP}/${member.xp.levelXP} POINTS`;
    const xpTextWidth = ctx.measureText(xpText).width;
    ctx.fillText(xpText, pageX + CARD_WIDTH - CARD_PADDING - xpTextWidth, pageY + 64);
    
    ctx.closePath();

    ctx.beginPath();
    const mainBarWidth = pageX + CARD_WIDTH - CARD_PADDING - tagX;
    ctx.fillStyle = "#777777";
    ctx.fillRect(tagX, pageY + 38, mainBarWidth, 10);
    ctx.closePath();
    
    ctx.beginPath();
    const progressBarWidth = Math.floor(mainBarWidth * (member.xp.userXP / member.xp.levelXP));
    ctx.fillStyle = "#7289DA";
    ctx.fillRect(tagX, pageY + 38, progressBarWidth, 10);
    ctx.closePath();
    
    ctx.restore();
  }
}

module.exports = { Mee6API };