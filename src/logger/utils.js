const winston = require('winston');
// Compiled Nest code, so that both loggers mask the same way. In the server process the Feathers app runs next to Nest,
// both load the same dist/apps/server/infra/configuration/secret-registry.js, so the secrets Nest registers at startup are
// masked here too. Processes without the Nest ConfigurationModule (e.g. scripts) have an empty registry, there only
// sensitive field names and Bearer tokens are redacted. Config values only Feathers reads are never registered.
const { LoggingUtils } = require('../../dist/apps/server/infra/logger/logging.utils');
const { summarizeOpaqueLogValue } = require('../../dist/apps/server/infra/logger/opaque-log-value');
const { maskSecretsInFields } = require('../../dist/apps/server/infra/logger/secret-masking');

const { format, transports } = winston;
const LEVEL = Symbol.for('level');

const defineValue = (target, key, value) => {
	// defineProperty instead of target[key]: a key "__proto__" (e.g. from parsed JSON) would set the prototype.
	Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
};

const secretMasker = maskSecretsInFields();
// Config secrets are masked before sensitive field names are redacted. Otherwise a secret under a name like "password"
// would be shortened by LoggingUtils to its first and last characters, which then no longer match the secret.
const maskSecretsInText = (text) => secretMasker.transform({ text }).text;

// Keeps the error class, name, message and stack (LoggingUtils logs errors by them), only its fields are converted.
const copyError = (error, ancestors) => {
	const copy = Object.create(Object.getPrototypeOf(error));
	for (const key of Reflect.ownKeys(error)) {
		const { enumerable } = Object.getOwnPropertyDescriptor(error, key);
		// Read through the error: stack can be an accessor that only works on the original error.
		// Strings like message and stack are masked too: LoggingUtils shortens "Bearer <secret>" before the final pass.
		const raw = error[key];
		const value = enumerable || key === 'cause' || typeof raw === 'string' ? toJsonValues(raw, ancestors) : raw;
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

const copyValue = (value, ancestors) => {
	if (value instanceof Error) {
		return copyError(value, ancestors);
	}

	const converted = typeof value.toJSON === 'function' ? callToJson(value) : undefined;
	// A toJSON that returns the value itself is ignored, the value is then copied property by property.
	if (converted && converted.json !== value) {
		return toJsonValues(converted.json, ancestors);
	}

	if (Array.isArray(value)) {
		return value.map((item) => toJsonValues(item, ancestors));
	}

	// Class instances become plain objects with their own fields, as in JSON and in LoggingUtils.
	const copy = {};
	for (const [key, item] of Object.entries(value)) {
		defineValue(copy, key, toJsonValues(item, ancestors));
	}

	return copy;
};

// Values with toJSON (dates, mongoose documents) become what the JSON log line showed before masking was added.
// The masking below copies objects property by property, so a date would become {} and a document its internal fields.
// Everything is copied, the objects passed to the logger are not changed. ObjectIds, buffers and streams are left
// to LoggingUtils, which summarizes them like the Nest logger does.
// Every occurrence of an object gets its own copy: LoggingUtils logs an object it has seen before as "[Circular]",
// so only real cycles (an object inside itself) are replaced by "[Circular]" here.
function toJsonValues(value, ancestors = new Set()) {
	if (typeof value === 'string') {
		return maskSecretsInText(value);
	}

	if (typeof value !== 'object' || value === null || summarizeOpaqueLogValue(value) !== undefined) {
		return value;
	}

	if (ancestors.has(value)) {
		return '[Circular]';
	}

	ancestors.add(value);
	try {
		return copyValue(value, ancestors);
	} finally {
		ancestors.delete(value);
	}
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

const maskingSteps = format.combine(redactSensitiveFields(), maskSecretsInFields());

// Only what is known to be safe: the level and the masked message text, never the unmasked fields.
const createMaskingFailedEntry = (info) => {
	const entry = { level: undefined, message: '[message not logged, masking failed]', maskingFailed: true };
	try {
		entry.level = info.level;
		entry[LEVEL] = info[LEVEL];
		if (typeof info.message === 'string') {
			entry.message = LoggingUtils.redactSensitiveValue(maskSecretsInText(info.message));
		}
	} catch {
		// The placeholder message stays.
	}

	return entry;
};

// Must come right before the format that serializes the entry (json, prettyPrint, printf), as on the Nest side.
// A log call must not throw because of the masking (e.g. a getter that throws or a very deeply nested value).
const maskSensitiveData = format((info) => {
	try {
		return maskingSteps.transform(info);
	} catch {
		return createMaskingFailedEntry(info);
	}
});

// TODO: is not nessasay in future please remove after logging is cleanup
const addType = format.printf((log) => {
	if (log.stack || log.level === 'error') {
		log.type = 'error';
	} else {
		log.type = 'log';
	}
	return log;
});

// errors() before the masking: it copies the enumerable fields, an error's message and stack are not enumerable.
const getTestFormat = () =>
	format.combine(format.errors({ stack: true }), maskSensitiveData(), format.prettyPrint({ depth: 1, colorize: true }));

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
