function displayTime(nanoseconds) {
  const microseconds = ~~(nanoseconds / 1000);
  const milliseconds = ~~(microseconds / 1000);
  const seconds = ~~(milliseconds / 1000);
  const minutes = ~~(seconds / 60);
  const hours = ~~(minutes / 60);
  const days = ~~(hours / 24);
  const weeks = ~~(days / 7);
 
  const displayNanoseconds = nanoseconds && nanoseconds % 1000;
  const displayMicroseconds = microseconds && microseconds % 1000;
  const displayMilliseconds = milliseconds && milliseconds % 1000;
  const displaySeconds = seconds && seconds % 60;
  const displayMinutes = minutes && minutes % 60;
  const displayHours = hours && hours % 60;
  const displayDays = days && days % 24;
  const displayWeeks = weeks && weeks % 7;

  return [
    displayWeeks && `${displayWeeks} week${displayWeeks > 1 ? "s" : ""}`,
    displayDays && `${displayDays} day${displayDays > 1 ? "s" : ""}`,
    displayHours && `${displayHours} hour${displayHours > 1 ? "s" : ""}`,
    displayMinutes && `${displayMinutes} minute${displayMinutes > 1 ? "s" : ""}`,
    displaySeconds && `${displaySeconds} second${displaySeconds > 1 ? "s" : ""}`,
    displayMilliseconds && `${displayMilliseconds}ns`,
    displayMicroseconds && `${displayMicroseconds}μs`,
    displayNanoseconds && `${displayNanoseconds}ns`
  ].filter(Boolean).join(", ");
}

function displayBigIntTime(nanoseconds) {
  const microseconds = nanoseconds / 1000n;
  const milliseconds = microseconds / 1000n;
  const seconds = milliseconds / 1000n;
  const minutes = seconds / 60n;
  const hours = minutes / 60n;
  const days = hours / 24n;
  const weeks = days / 7n;
 
  const displayNanoseconds = nanoseconds && nanoseconds % 1000n;
  const displayMicroseconds = microseconds && microseconds % 1000n;
  const displayMilliseconds = milliseconds && milliseconds % 1000n;
  const displaySeconds = seconds && seconds % 60n;
  const displayMinutes = minutes && minutes % 60n;
  const displayHours = hours && hours % 60n;
  const displayDays = days && days % 24n;
  const displayWeeks = weeks && weeks % 7n;

  return [
    displayWeeks && `${displayWeeks} week${displayWeeks > 1n ? "s" : ""}`,
    displayDays && `${displayDays} day${displayDays > 1n ? "s" : ""}`,
    displayHours && `${displayHours} hour${displayHours > 1n ? "s" : ""}`,
    displayMinutes && `${displayMinutes} minute${displayMinutes > 1n ? "s" : ""}`,
    displaySeconds && `${displaySeconds} second${displaySeconds > 1n ? "s" : ""}`,
    displayMilliseconds && `${displayMilliseconds}ms`,
    displayMicroseconds && `${displayMicroseconds}μs`,
    displayNanoseconds && `${displayNanoseconds}ns`
  ].filter(Boolean).join(", ");
}

module.exports = { displayTime, displayBigIntTime };