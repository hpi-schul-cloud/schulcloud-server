const winston = require('winston');

/** version 2.0 implementation need update to version 3.0 */
exports.logger = new winston.Logger({
    transports: [
      new winston.transports.Console({
        handleExceptions: true,
        json: true
      })
    ],
    exitOnError: false
});