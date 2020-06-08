const util = require("util");
const { Benchmark } = require("../../structures/Benchmark.js");
const { displayBigIntTime } = require("../../methods/displayTime.js");

module.exports = {
  description: "Executes NodeJS code",
  icon: {
    emoji: "📜",
    url: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/236/scroll_1f4dc.png"
  },
  args: {
    detectors: [/[^]+/],
    usage: [{
      title: "Execute code",
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
}, args) {

  let evalResult = ``;
  let evalOutput = ``;
  
  const benchmark = new Benchmark();
  const execBenchmark = new Benchmark();

  try {
    execBenchmark.start();
    evalResult = eval(`${args.code}`);
    execBenchmark.stop();
    
    evalOutput = util.inspect(evalResult);
  } catch (err) {
    let modifiedMessage = {};

    if (err.stack) {
      // let {errorMessage, lineCode} = e.stack.match(/(?<errorMessage>[^\n]+)\n\s*at eval \(eval at exports.run \(\/home\/spuggle\/spuiiBot\/commands\/exec.js\:\d+\:\d+\), \<anonymous\>\:(?<lineCode>\d+:\d+)\)/).groups;
      modifiedMessage = err.stack; // `Line ${lineCode} - ${errorMessage}`
    }
    evalOutput = modifiedMessage;
  }
  const outputMessage = await channel.send(`${`_**Execution time:** ${execBenchmark.display()}_`}${benchmark.timeTaken ? `\n_**Benchmark:** ${benchmark.display()}_` : ""}\`\`\`js\n< ${evalOutput}\`\`\``);
  if (evalResult instanceof Promise) evalResult.finally(() => {
    execBenchmark.stopTime = process.hrtime.bigint();
    outputMessage.edit(`${`_**Execution time:** ${execBenchmark.display()}_`}${benchmark.timeTaken ? `\n_**Benchmark:** ${benchmark.display()}_` : ""}\`\`\`js\n< ${util.inspect(evalResult)}\`\`\``);
  });
}

function parse(dataPack, [ code ]) {
  return { code };
}