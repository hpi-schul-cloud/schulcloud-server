const winston = require('winston');
// Compiled Nest code, so that both loggers mask the same way and share the SecretRegistry the Nest app fills at startup.
const { LoggingUtils } = require('../../dist/apps/server/infra/logger/logging.utils');
const { summarizeOpaqueLogValue } = require('../../dist/apps/server/infra/logger/opaque-log-value');
const { maskSecretsInFields } = require('../../dist/apps/server/infra/logger/secret-masking');

const { format, transports } = winston;

const defineValue = (target, key, value) => {
	// defineProperty instead of target[key]: a key "__proto__" (e.g. from parsed JSON) would set the prototype.
	Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
};

// Keeps the error class, name, message and stack (LoggingUtils logs errors by them), only its fields are converted.
const copyError = (error, copies) => {
	const copy = Object.create(Object.getPrototypeOf(error));
	copies.set(error, copy);
	for (const key of Reflect.ownKeys(error)) {
		const { enumerable } = Object.getOwnPropertyDescriptor(error, key);
		// Read through the error: stack can be an accessor that only works on the original error.
		const value = enumerable || key === 'cause' ? toJsonValues(error[key], copies) : error[key];
		Object.defineProperty(copy, key, { value, enumerable, writable: true, configurable: true });
	}

	return copy;
};

const callToJson = (value) => {
	try {
		return { json: value.toJSON() };
	} catch {
		// A broken toJSON must not break the log call, the value is then logged property by property.
		return undefined;
	}
};

// Values with toJSON (dates, mongoose documents) become what the JSON log line showed before masking was added.
// The masking below copies objects property by property, so a date would become {} and a document its internal fields.
// Everything is copied, the objects passed to the logger are not changed. ObjectIds, buffers and streams are left
// to LoggingUtils, which summarizes them like the Nest logger does.
function toJsonValues(value, copies = new WeakMap()) {
	if (typeof value !== 'object' || value === null || summarizeOpaqueLogValue(value) !== undefined) {
		return value;
	}

	if (copies.has(value)) {
		return copies.get(value);
	}

	if (value instanceof Error) {
		return copyError(value, copies);
	}

	const converted = typeof value.toJSON === 'function' ? callToJson(value) : undefined;
	if (converted) {
		// Set before descending, so a toJSON result that references the value again cannot loop.
		copies.set(value, converted.json);
		const result = converted.json === value ? value : toJsonValues(converted.json, copies);
		copies.set(value, result);

		return result;
	}

	if (Array.isArray(value)) {
		const copy = [];
		copies.set(value, copy);
		value.forEach((item) => copy.push(toJsonValues(item, copies)));

		return copy;
	}

	// Class instances become plain objects with their own fields, as in JSON and in LoggingUtils.
	const copy = {};
	copies.set(value, copy);
	for (const [key, item] of Object.entries(value)) {
		defineValue(copy, key, toJsonValues(item, copies));
	}

	return copy;
}

// Redacts values of sensitive field names (token, password, ...) and Bearer tokens, like LoggingUtils for Nest loggables.
// Returns a new info object: winston passes the caller's object as info for logger.info(obj), it must stay unchanged.
const redactSensitiveFields = format((info) => {
	const redacted = LoggingUtils.redactSensitiveValue(toJsonValues(Object.fromEntries(Object.entries(info))));
	// The spread keeps winston's symbol keys (level, message, splat) and keys LoggingUtils leaves out (functions).
	const result = { ...info };
	for (const [key, value] of Object.entries(redacted)) {
		defineValue(result, key, value);
	}

	return result;
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
