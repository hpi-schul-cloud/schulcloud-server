const winston = require('winston');

const { format } = winston;

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

const getProductionFormat = () =>
	format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		addType,
		format.prettyPrint({ depth: 3, colorize: false })
	);

const getDevelopFormat = () =>
	format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		addType,
		format.prettyPrint({ depth: 3, colorize: true })
	);

module.exports = {
	addType,
	getTestFormat,
	getDevelopFormat,
	getProductionFormat,
};
