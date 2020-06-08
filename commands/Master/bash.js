const util = require("util");
const { Benchmark } = require("../../structures/Benchmark.js");
const { displayBigIntTime } = require("../../methods/displayTime.js");
const exec = require('child_process').exec;

module.exports = {
  description: "Executes bash code",
  icon: {
    emoji: "📜",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/236/scroll_1f4dc.png"
  },
  args: {
    detectors: [/[^]+/],
    usage: [{
      title: "Execute bash code",
      parameters: [
        "[Code]"
      ]
    }]
  },
  run,
  parse
}

async function run({
  client, message,
  channel, pack
}, { code }) {
  const bashPromise = await new Promise(function(resolve, reject) {
    let status = "";
    
    const dir = exec(code, function(err, stdout, stderr) {
      return resolve(`\`\`\`Exited with code ${status}\`\`\`\n\`\`\`js\n${err
        ? util.inspect(err)
        : stdout}\`\`\``);
    });

    dir.on('exit', function (exitCode) {
      status = exitCode;
    });
  })
    .then(msg => message.channel.send(msg))
    .catch(err => console.error(err));
  
  return bashPromise;
}

function parse(dataPack, [ code ]) {
  return { code };
}