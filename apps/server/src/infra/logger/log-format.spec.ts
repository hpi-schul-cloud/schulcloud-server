import { createLogFormat } from './log-format';
import { LogFormat } from './logger.config';

// winston stores the final output under this symbol (MESSAGE from triple-beam)
const MESSAGE = Symbol.for('message');

const render = (logFormat: LogFormat, info: Record<string, unknown>): string => {
	const result = createLogFormat(logFormat).transform({ level: 'info', message: '', ...info });
	if (!result || typeof result === 'boolean') {
		throw new Error('log entry was filtered out');
	}

	return String((result as unknown as Record<symbol, unknown>)[MESSAGE]);
};

describe('createLogFormat', () => {
	describe('when the log format is json', () => {
		it('should write the entry as valid JSON', () => {
			const output = render(LogFormat.JSON, { message: 'user created', context: 'UserService' });

			expect(JSON.parse(output)).toEqual(
				expect.objectContaining({ level: 'info', message: 'user created', context: 'UserService' })
			);
		});

		it('should add an ISO timestamp', () => {
			const output = render(LogFormat.JSON, { message: 'user created' });

			const { timestamp } = JSON.parse(output) as { timestamp: string };
			expect(new Date(timestamp).toISOString()).toBe(timestamp);
		});

		it('should write the entry in one line', () => {
			const output = render(LogFormat.JSON, { message: 'first line\nsecond line' });

			expect(output).not.toContain('\n');
		});
	});

	describe('when the log format is json and fields are added', () => {
		it('should start every line with timestamp, level, context and message', () => {
			const output = render(LogFormat.JSON, {
				extra: 'value',
				error: { message: 'boom' },
				data: { userId: '123' },
				message: 'user created',
				module: 'UserModule',
				context: 'UserService',
			});

			expect(Object.keys(JSON.parse(output) as object)).toEqual([
				'timestamp',
				'level',
				'context',
				'module',
				'message',
				'data',
				'error',
				'extra',
			]);
		});

		it('should not write the fields reserved for tracing', () => {
			const output = render(LogFormat.JSON, { message: 'user created', trace_id: 'abc', span_id: 'def' });

			expect(JSON.parse(output)).not.toHaveProperty('trace_id');
			expect(JSON.parse(output)).not.toHaveProperty('span_id');
		});

		it('should keep message and stack of a raw error', () => {
			const output = render(LogFormat.JSON, { message: 'uncaughtException: boom', error: new Error('boom') });

			const { error } = JSON.parse(output) as { error: { message: string; stack: string } };
			expect(error.message).toBe('boom');
			expect(error.stack).toContain('log-format.spec.ts');
		});

		it('should redact sensitive values of a raw error', () => {
			const error = Object.assign(new Error('boom'), { accessToken: 'eyJhbGciOiJIUzI1NiJ9.payload' });

			const output = render(LogFormat.JSON, { message: 'uncaughtException: boom', error });

			expect(output).not.toContain('eyJhbGciOiJIUzI1NiJ9.payload');
		});

		it('should write circular values without failing', () => {
			const data: Record<string, unknown> = { name: 'loop' };
			data.self = data;

			const output = render(LogFormat.JSON, { message: 'circular', data });

			expect(JSON.parse(output)).toEqual(expect.objectContaining({ data: { name: 'loop', self: '[Circular]' } }));
		});

		it('should keep the internal level used by winston to filter entries', () => {
			const info = { level: 'info', message: 'user created', [Symbol.for('level')]: 'info' };

			const result = createLogFormat(LogFormat.JSON).transform(info) as unknown as Record<symbol, unknown>;

			expect(result[Symbol.for('level')]).toBe('info');
		});
	});

	describe('when the log format is pretty', () => {
		it('should write the entry in the readable nest format', () => {
			const output = render(LogFormat.PRETTY, { message: 'user created', context: 'UserService' });

			expect(output).toContain('[UserService]');
			expect(output).toContain('user created');
			expect(() => JSON.parse(output) as unknown).toThrow();
		});

		it('should show the module together with the context', () => {
			const output = render(LogFormat.PRETTY, {
				message: 'user created',
				context: 'UserService',
				module: 'UserModule',
			});

			expect(output).toContain('[UserModule/UserService]');
			expect(output).not.toContain('"module"');
		});
	});
});
