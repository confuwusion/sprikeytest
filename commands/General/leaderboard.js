const { Benchmark } = require("../../structures/Benchmark.js");

module.exports = {
  description: "View rankings on Mee6",
  icon: {
    emoji: "🥇",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/248/1st-place-medal_1f947.png"
  },
  args: {
    usage: [{
      title: "View rankings in a specific page",
      parameters: [
        "[Page Number]"
      ]
    }],
    detectors: [
      /^\d+/i
    ]
  },
  parse,
  run
}

async function run({ botPack, cache, message, messageDefault }, { page }) {
  message.react("710180000896253953");
  
  const imageBench = new Benchmark(true);
  const leaderboardCanvas = await botPack.levels.renderLeaderboard(page);
  const leaderboardBuffer = leaderboardCanvas.toBuffer("image/png");
  imageBench.stop();
  
  const loadingReaction = message.reactions.cache.get("710180000896253953");
  if (loadingReaction) loadingReaction.remove();
  
  return messageDefault(`*Image rendering took ${imageBench.display()}*`)
    .attachFiles([ { name: "leaderboard.png", attachment: leaderboardBuffer } ])
    .setImage(`attachment://leaderboard.png`)
    .setFooter(`Showing Page ${page}`);
}

function parse({}, [ givenPage ]) {
  const page = parseInt(givenPage, 10) || 1;
  
  return { page };
}