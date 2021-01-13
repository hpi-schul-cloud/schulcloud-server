const winston = require('winston');

const { format, transports } = winston;

// TODO: is not nessasay in future please remove after logging is cleanup
const addType = format.printf((log) => {
	if (log.stack || log.level === 'error') {
		log.type = 'error';
	} else {
		log.type = 'log';
	}
	return log;
});

const getTestFormat = () => format.combine(format.prettyPrint({ depth: 1, colorize: true }));

const getProductionFormat = () => undefined;
/*
	format.combine(
		// format.errors({ stack: true }),
		format.timestamp(),
		addType
		// format.prettyPrint({ depth: 3, colorize: false })
	);
*/
const getDevelopFormat = () =>
	format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		addType,
		format.prettyPrint({ depth: 3, colorize: true })
	);

const getConsoleTransport = (level) =>
	new transports.Console({
		level,
		handleExceptions: true,
		// https://github.com/winstonjs/winston#handling-uncaught-promise-rejections-with-winston
		handleRejections: true,
	});

const createLogger = (formater, level) =>
	winston.createLogger({
		levels: winston.config.syslog.levels,
		level,
		format: formater,
		transports: [getConsoleTransport(level)],
		exitOnError: false,
	});

module.exports = {
	addType,
	getTestFormat,
	getDevelopFormat,
	getProductionFormat,
	getConsoleTransport,
	createLogger,
};
