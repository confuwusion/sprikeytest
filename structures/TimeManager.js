const Cron = require("cron");

const eventTypes = ["repeating", "fixed"];

function generateCronPattern(time) {
  const seconds = ~~(time / 1000);
  const minutes = ~~(seconds / 60);
  const hours = ~~(minutes / 60);
  const days = ~~(hours / 24);
  const weeks = ~~(days / 7);
  const months = ~~(days / 31)

  const timeArr = [
    seconds % 60,
    minutes % 60,
    hours % 24,
    days % 7,
    weeks % 4,
    months % 12
  ];

  const firstIndex = timeArr.findIndex(Boolean);

  const cronPattern = timeArr
    .map((timeComp, index) => (index < firstIndex) ?
      "0" :
      (timeComp ?
        `*/${timeComp}` :
        "*"
      )
    )
    .join(" ");

  return cronPattern;
}

class TimeManager {
  constructor({ cache }, handlers = {}) {
    const classThis = this;
    
    this.cache = cache;
    this.jobs = new Map();
    this.jobData = cache.jobData;
    this.handlers = new Map(Object.entries(handlers));
    this.loadMissed = function() {
      return cache.jobData.map(([ dataIndex, { eventName, eventType, eventTime, eventData } ]) => {
        const inactivityGap = Date.now() - cache.botLastActive;
      
        console.log("Inactivity Gap", inactivityGap);
        console.log("Event Missed", eventTime <= inactivityGap);
        console.log("Times missed", ~~(inactivityGap / eventTime));
      
        if (eventType === "fixed" && eventTime <= Date.now() + 29999) {
          return classThis.emit(dataIndex, {
            isLate: true,
            inactivityGap
          }, dataIndex);
        } else if (eventType === "repeating" && eventTime <= inactivityGap) {
          const eventProgress = inactivityGap / eventTime;
          const timesMissed = ~~eventProgress;
          const nextOn = (eventProgress - timesMissed) * eventTime;
        
          classThis.emit(dataIndex, {
            isLate: true,
            inactivityGap,
            timesMissed,
            nextOn
          });
        }
        const useTime = eventType === "fixed" ? eventTime - Date.now() : eventTime;
      
        return classThis.schedule(eventName, eventType, useTime, eventData, dataIndex);
      });
    }
  }

  schedule(eventName, eventType = "", eventTime = 0, eventData = {}, givenIndex = null) {
    if (!eventName) return new Error("You did not provide the event name!");
    if (!this.handlers.has(eventName)) return new Error("You provided an invalid event name!");

    if (!eventType) return new Error("You did not provide an event type!");
    if (!eventTypes.includes(eventType.toLowerCase())) return new Error(`You have provided an invalid event type! Please provide one of the following types: ${eventTypes.join(" or ")}`);

    if (isNaN(eventTime)) return new Error("You provided an invalid event time!");
    if (eventType === "repeating" && eventTime < 900000) return new Error("The provided event time is too small! It should be greater than or equals to 15 minutes");
    if (eventType === "fixed" && eventTime < 30000) return new Error("The provided event time is too small! It should be greater than or equals to 30 seconds");
    if (eventTime > 604800000) return new Error("The provided event time is too large! It should be smaller than or equals to 168 hours");
    const useTime = eventType === "fixed" ? Date.now() + eventTime : eventTime;
    
    if (!eventData) return new Error("You did not provide any event data!");
    
    const dataIndex = givenIndex || this.jobData.allocate();
    
    if (!givenIndex || !this.jobData.has(givenIndex)) {
      this.jobData.set(dataIndex, {
        eventName, eventType, eventTime: useTime, eventData,
        eventIndex: dataIndex
      });
      this.cache.save("jobData");
    }
    
    const jobTime = eventType === "repeating"
      ? generateCronPattern(useTime)
      : new Date(useTime);

    const job = new Cron.CronJob(jobTime, this.emit.bind(this, dataIndex, {}), null, true);

    this.jobs.set(dataIndex, job);
    
    return dataIndex; 
  }

 unschedule(cronID) {
    const jobData = this.jobs.get(cronID);
    if (!jobData) return false;

    jobData.stop();
    this.jobs.delete(cronID);
    this.jobData.delete(cronID);
    return this.cache.save("jobData");
  }

  async emit(eventIndex, late = {}) {
    const { eventName, eventTime, eventType, eventData } = this.jobData.get(eventIndex);
    const handler = this.handlers.get(eventName);
    const state = await handler(eventIndex, eventData, late);
    
    if (state && eventType === "fixed") {
      this.jobData.delete(eventIndex);
      this.cache.save("jobData");
    }

    return state;
  }
}

module.exports = { TimeManager };