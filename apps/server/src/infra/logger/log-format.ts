import { utilities } from 'nest-winston';
import winston from 'winston';
import { LogFormat } from './logger.config';
import { LoggingUtils } from './logging.utils';

// Reserved for tracing (OpenTelemetry). Set only by tracing, never by log messages.
const RESERVED_TRACING_FIELDS = ['trace_id', 'span_id'];

// Shows the module in the context brackets, e.g. [BoardModule/BoardService], instead of as extra field on every line.
const mergeModuleIntoContext = winston.format((info) => {
	const { module, ...rest } = info;
	if (typeof module !== 'string') {
		return info;
	}

	const context = typeof rest.context === 'string' && rest.context ? `${module}/${rest.context}` : module;

	return { ...rest, context };
});

const createPrettyFormat = (): winston.Logform.Format =>
	winston.format.combine(
		mergeModuleIntoContext(),
		winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
		winston.format.ms(),
		utilities.format.nestLike()
	);

// Puts the common fields first, so every log line starts the same way.
// Raw errors (e.g. from winston's uncaught exception handler) are serialized, otherwise JSON would drop message and stack.
const orderFields = winston.format((info) => {
	const { timestamp, level, context, module, message, data, error, ...rest } = info;

	for (const field of RESERVED_TRACING_FIELDS) {
		delete rest[field];
	}

	return {
		timestamp,
		level,
		context,
		module,
		message,
		data,
		error: error instanceof Error ? LoggingUtils.redactSensitiveValue(error) : error,
		...rest,
	};
});

const createJsonFormat = (): winston.Logform.Format =>
	winston.format.combine(winston.format.timestamp(), orderFields(), winston.format.json({ deterministic: false }));

export const createLogFormat = (logFormat: LogFormat): winston.Logform.Format =>
	logFormat === LogFormat.PRETTY ? createPrettyFormat() : createJsonFormat();
