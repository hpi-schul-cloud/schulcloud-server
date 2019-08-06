const winston = require('winston');

const SPLAT = Symbol.for('splat');

let logLevel;

switch (process.env.NODE_ENV) {
	case 'default':
	case 'development':
		logLevel = 'debug';
		break;
	case 'test':
		logLevel = 'emerg';
		break;
	case 'production':
	default:
		logLevel = 'info';
}

function formatObject(param) {
	if (typeof param === 'object') {
		return JSON.stringify(param);
	}
	return param;
}

// workaround to call log functions with multiple message parameter.
// example: logger.info('first', 'secound', 'some other string')
const all = winston.format((info) => {
	const isSplatTypeMessage = typeof info.message === 'string'
		&& (info.message.includes('%s') || info.message.includes('%d') || info.message.includes('%j'));

	const splat = info[SPLAT] || [];

	if (isSplatTypeMessage || splat.length === 0) {
		return info;
	}

	const message = formatObject(info.message);
	const rest = splat
		.map(formatObject)
		.join(' ');
	info.message = `${message} ${rest}`;
	return info;
});

const logger = winston.createLogger({
	levels: winston.config.syslog.levels,
	format: winston.format.combine(
		all(),
		winston.format.timestamp(), // adds current timestamp
		winston.format.ms(),	// adds time since last log
		winston.format.simple(), // output as string. Use 'winston.format.simple()' for output prettyfied json
	),
	transports: [
		new winston.transports.Console({
			level: logLevel,
			handleExceptions: true,
		}),
	],
	exitOnError: false,
});


module.exports = logger;
