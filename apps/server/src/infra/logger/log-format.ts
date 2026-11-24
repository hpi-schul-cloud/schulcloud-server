import winston from 'winston';
import { LoggingUtils } from './logging.utils';
import { maskSecretsInFields } from './secret-masking';
import { redactSecretsInText } from './url-path-secrets';

// winston stores the finished line under this symbol (MESSAGE from triple-beam).
const MESSAGE = Symbol.for('message');

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

// URLs with secrets can be anywhere in an entry (message, stack, request data), so the finished line is checked once.
// Only characters of the secret are replaced, never quotes or backslashes, so the line stays valid JSON.
const redactUrlSecretsInLine = winston.format((info) => {
	const record = info as unknown as Record<symbol, unknown>;
	const line = record[MESSAGE];
	if (typeof line === 'string') {
		record[MESSAGE] = redactSecretsInText(line);
	}

	return info;
});

// One JSON object per line, in every environment.
export const createLogFormat = (): winston.Logform.Format =>
	winston.format.combine(
		winston.format.timestamp(),
		orderFields(),
		// Before serializing: masking the finished JSON line could break it (see maskSecretsInFields).
		maskSecretsInFields(),
		winston.format.json({ deterministic: false }),
		redactUrlSecretsInLine()
	);
