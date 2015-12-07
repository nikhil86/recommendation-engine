var winston = require('winston');
winston.emitErrs = true;

var myCustomLevels = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  },
  colors: {
    debug: 'blue',
    info: 'green',
    warn: 'yellow',
    error: 'red'
  }
};
winston.addColors(myCustomLevels.colors);
var logger = new winston.Logger({
  level: 'debug',
  levels: myCustomLevels.levels,
  transports: [
    new winston.transports.Console({
      level: 'debug', // Only write logs of info level or higher
      levels: myCustomLevels.levels,
      handleExceptions: true,
      json: false,
      colorize: true
    })
  ],
  exitOnError: false
});

module.exports = logger;
