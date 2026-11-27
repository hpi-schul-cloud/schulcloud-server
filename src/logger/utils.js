const winston = require('winston');
// Compiled Nest code, so that both loggers mask the same way. In the server process the Feathers app runs next to Nest,
// both load the same dist/apps/server/infra/configuration/secret-registry.js, so the secrets Nest registers at startup are
// masked here too. Processes without the Nest ConfigurationModule (e.g. scripts) have an empty registry, there only
// sensitive field names, Bearer tokens and URL secrets are redacted. Config values only Feathers reads are never registered.
const { LoggingUtils } = require('../../dist/apps/server/infra/logger/logging.utils');
const { summarizeOpaqueLogValue } = require('../../dist/apps/server/infra/logger/opaque-log-value');
const { maskSecretsInFields } = require('../../dist/apps/server/infra/logger/secret-masking');
const { redactSecretsInText } = require('../../dist/apps/server/infra/logger/url-path-secrets');

const { format, transports } = winston;
const LEVEL = Symbol.for('level');
const MESSAGE = Symbol.for('message');

const defineValue = (target, key, value) => {
	// defineProperty instead of target[key]: a key "__proto__" (e.g. from parsed JSON) would set the prototype.
	Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
};

const secretMasker = maskSecretsInFields();
// Config secrets are masked before sensitive field names are redacted. Otherwise a secret under a name like "password"
// would be shortened by LoggingUtils to its first and last characters, which then no longer match the secret.
const maskSecretsInText = (text) => secretMasker.transform({ text }).text;

// Read from the original error, never through the copy: getters like those of DOMException or #private fields
// throw on any other object. A value that cannot be read is left out.
const readProperty = (object, key) => {
	try {
		return { value: object[key] };
	} catch {
		return undefined;
	}
};

// Inherited fields LoggingUtils logs an error by. Getters on the prototype (DOMException) would throw on the copy,
// so they become own data properties of the copy.
const ERROR_FIELDS = ['name', 'message', 'stack', 'code'];

// Keeps the error class, so instanceof and LoggingUtils.redactError still treat the copy as an error.
// Strings like message and stack are masked too: LoggingUtils shortens "Bearer <secret>" before the final pass.
const copyError = (error, ancestors) => {
	const copy = Object.create(Object.getPrototypeOf(error));
	for (const key of Reflect.ownKeys(error)) {
		const { enumerable } = Object.getOwnPropertyDescriptor(error, key);
		const read = readProperty(error, key);
		if (read) {
			const { value: raw } = read;
			const value = enumerable || key === 'cause' || typeof raw === 'string' ? toJsonValues(raw, ancestors) : raw;
			Object.defineProperty(copy, key, { value, enumerable, writable: true, configurable: true });
		}
	}

	for (const key of ERROR_FIELDS) {
		const read = Object.hasOwn(copy, key) ? undefined : readProperty(error, key);
		if (read && read.value !== undefined) {
			// code is logged like an own field, name, message and stack are read by LoggingUtils directly.
			Object.defineProperty(copy, key, {
				value: toJsonValues(read.value, ancestors),
				enumerable: key === 'code',
				writable: true,
				configurable: true,
			});
		}
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

// A Map with string keys becomes a plain object, so LoggingUtils redacts its values by key name like any other field.
// Other keys cannot be field names, such a Map becomes [key, value] pairs.
const copyMap = (map, ancestors) => {
	const entries = [...map.entries()];
	if (!entries.every(([key]) => typeof key === 'string')) {
		return entries.map(([key, item]) => [toJsonValues(key, ancestors), toJsonValues(item, ancestors)]);
	}

	const copy = {};
	for (const [key, item] of entries) {
		defineValue(copy, maskSecretsInText(key), toJsonValues(item, ancestors));
	}

	return copy;
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

	// JSON and LoggingUtils would log a Map or Set as {}, their content is logged instead.
	if (value instanceof Set) {
		return [...value].map((item) => toJsonValues(item, ancestors));
	}

	if (value instanceof Map) {
		return copyMap(value, ancestors);
	}

	// Class instances become plain objects with their own fields, as in JSON and in LoggingUtils.
	const copy = {};
	for (const [key, item] of Object.entries(value)) {
		defineValue(copy, key, toJsonValues(item, ancestors));
	}

	return copy;
};

// Nesting levels of an entry that are logged, counted from the entry itself. Deeper values are logged as [Object] or [Array].
const MAX_DEPTH = 10;

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

	// Every occurrence is copied, so an object shared on many levels ({ a: node, b: node }) would grow exponentially.
	// The limit also keeps very deep values from overflowing the stack.
	if (ancestors.size >= MAX_DEPTH) {
		return Array.isArray(value) ? '[Array]' : '[Object]';
	}

	ancestors.add(value);
	try {
		return copyValue(value, ancestors);
	} finally {
		ancestors.delete(value);
	}
}

// The entry fields winston and our formats set. Of winston's symbols only the level is kept: the serializer sets the
// message symbol again, and the splat symbol holds the caller's raw arguments.
const createBaseEntry = (info) => {
	const entry = { [LEVEL]: info[LEVEL] };
	for (const key of ['level', 'timestamp', 'type']) {
		if (typeof info[key] === 'string') {
			entry[key] = maskSecretsInText(info[key]);
		}
	}

	return entry;
};

// Redacts values of sensitive field names (token, password, ...) and Bearer tokens, like LoggingUtils for Nest loggables.
// Returns a new info object: winston passes the caller's object as info for logger.info(obj), it must stay unchanged.
const redactSensitiveFields = format((info) => {
	// Functions are left out, so an own toJSON of the entry is neither called here nor kept for the serializer.
	const fields = Object.fromEntries(Object.entries(info).filter(([, value]) => typeof value !== 'function'));
	const redacted = LoggingUtils.redactSensitiveValue(toJsonValues(fields));
	// Only the redacted fields, never other original keys: for an axios error as the whole entry LoggingUtils returns
	// a summary without its request config, and an own toJSON would be called by the serializer.
	const result = createBaseEntry(info);
	for (const [key, value] of Object.entries(redacted)) {
		// Keys inside the fields are masked by maskSecretsInFields, the keys of the entry itself here.
		defineValue(result, maskSecretsInText(key), value);
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
		for (const key of ['timestamp', 'type']) {
			if (typeof info[key] === 'string') {
				entry[key] = maskSecretsInText(info[key]);
			}
		}
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

// URLs with secrets (e.g. /passwordRecovery/<token>, ?shareToken=) can be anywhere in an entry, so the finished line is
// checked once, after the serializer, as on the Nest side. Only characters of the secret are replaced, JSON stays valid.
const redactUrlSecretsInLine = format((info) => {
	try {
		if (typeof info[MESSAGE] === 'string') {
			info[MESSAGE] = redactSecretsInText(info[MESSAGE]);
		}
	} catch {
		// A log call must not throw, the line is already masked by maskSensitiveData.
	}

	return info;
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
	format.combine(
		format.errors({ stack: true }),
		maskSensitiveData(),
		format.prettyPrint({ depth: 1, colorize: true }),
		redactUrlSecretsInLine()
	);

const getProductionFormat = () =>
	format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		addType,
		maskSensitiveData(),
		format.json(),
		redactUrlSecretsInLine()
	);

const getDevelopFormat = () =>
	format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		addType,
		maskSensitiveData(),
		format.prettyPrint({ depth: 3, colorize: true }),
		redactUrlSecretsInLine()
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
	redactUrlSecretsInLine,
};
