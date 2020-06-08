const INPUT_CAPTURE = /\{\[inp\]\}/g;

function extractArgs(content) {
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
    const userCapture = (remaining.match(detector) || [""])[0].replace(
      /\$&/g,
      "\\$\\&"
    );
    const completeArg = filler.replace(INPUT_CAPTURE, userCapture).trim();

    // Use the original regex on the completed
    // argument to produce expected behaviour,
    // thus expected output
    const wholeCapture = completeArg.match(detector);

    // Take out the captured part from user input
    // If nothing was captured, then this will
    // slice to return the same string
    remaining = remaining.slice(userCapture.length).trim();
    return wholeCapture;
  });
}
