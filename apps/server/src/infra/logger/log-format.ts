import winston from 'winston';
import { LoggingUtils } from './logging.utils';
import { maskSecretsInFields } from './secret-masking';

// Reserved for tracing (OpenTelemetry). Set only by tracing, never by log messages.
const RESERVED_TRACING_FIELDS = ['trace_id', 'span_id'];

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

// One JSON object per line, in every environment.
export const createLogFormat = (): winston.Logform.Format =>
	winston.format.combine(
		winston.format.timestamp(),
		orderFields(),
		// Before serializing: masking the finished JSON line could break it (see maskSecretsInFields).
		maskSecretsInFields(),
		winston.format.json({ deterministic: false })
	);
