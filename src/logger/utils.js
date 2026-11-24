const winston = require('winston');
// Compiled Nest code, so that both loggers mask the same way and share the SecretRegistry the Nest app fills at startup.
const { LoggingUtils } = require('../../dist/apps/server/infra/logger/logging.utils');
const { maskSecretsInFields } = require('../../dist/apps/server/infra/logger/secret-masking');

const { format, transports } = winston;

const isPlainObject = (value) => {
	const prototype = Object.getPrototypeOf(value);

	return prototype === Object.prototype || prototype === null;
};

// Values with toJSON (dates, mongoose documents, ObjectIds) become what the JSON log line shows anyway.
// The masking below copies objects property by property, so a date would become {} and a document its internal fields.
// Plain objects and arrays are copied, the objects passed to the logger are not changed.
const toJsonValues = (value, copies = new WeakMap()) => {
	if (typeof value !== 'object' || value === null || value instanceof Error) {
		return value;
	}

	if (copies.has(value)) {
		return copies.get(value);
	}

	if (typeof value.toJSON === 'function') {
		const json = value.toJSON();
		// Set before descending, so a toJSON result that references the value again cannot loop.
		copies.set(value, json);
		const result = json === value ? json : toJsonValues(json, copies);
		copies.set(value, result);

		return result;
	}

	if (Array.isArray(value)) {
		const copy = [];
		copies.set(value, copy);
		value.forEach((item) => copy.push(toJsonValues(item, copies)));

		return copy;
	}

	if (!isPlainObject(value)) {
		return value;
	}

	const copy = {};
	copies.set(value, copy);
	for (const [key, item] of Object.entries(value)) {
		Object.defineProperty(copy, key, {
			value: toJsonValues(item, copies),
			enumerable: true,
			writable: true,
			configurable: true,
		});
	}

	return copy;
};

// Redacts values of sensitive field names (token, password, ...) and Bearer tokens, like LoggingUtils for Nest loggables.
// Only the string keys are replaced, winston's symbol keys (level, splat) stay as they are.
const redactSensitiveFields = format((info) => {
	const redacted = LoggingUtils.redactSensitiveValue(toJsonValues(Object.fromEntries(Object.entries(info))));
	for (const [key, value] of Object.entries(redacted)) {
		// defineProperty instead of info[key]: a key "__proto__" (e.g. from parsed JSON) would set the prototype.
		Object.defineProperty(info, key, { value, enumerable: true, writable: true, configurable: true });
	}

	return info;
});

// Must come right before the format that serializes the entry (json, prettyPrint, printf), as on the Nest side.
const maskSensitiveData = () => format.combine(redactSensitiveFields(), maskSecretsInFields());

// TODO: is not nessasay in future please remove after logging is cleanup
const addType = format.printf((log) => {
	if (log.stack || log.level === 'error') {
		log.type = 'error';
	} else {
		log.type = 'log';
	}
	return log;
});

const getTestFormat = () => format.combine(maskSensitiveData(), format.prettyPrint({ depth: 1, colorize: true }));

const getProductionFormat = () =>
	format.combine(format.errors({ stack: true }), format.timestamp(), addType, maskSensitiveData(), format.json());

const getDevelopFormat = () =>
	format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		addType,
		maskSensitiveData(),
		format.prettyPrint({ depth: 3, colorize: true })
	);

const getConsoleTransport = (level) =>
	new transports.Console({
		level,
		handleExceptions: true,
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
	getTestFormat,
	getDevelopFormat,
	getProductionFormat,
	createLogger,
	maskSensitiveData,
};
