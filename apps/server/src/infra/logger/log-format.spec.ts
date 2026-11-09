import { SecretRegistry } from '@infra/configuration';
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

describe('createLogFormat with secrets', () => {
	const clientSecret = 'super-secret-client-value';

	beforeEach(() => {
		SecretRegistry.register(clientSecret);
	});

	afterEach(() => {
		SecretRegistry.clear();
	});

	it.each([LogFormat.JSON, LogFormat.PRETTY])('should mask secret values in %s logs', (logFormat) => {
		const output = render(logFormat, { message: `token request with ${clientSecret}`, data: { body: clientSecret } });

		expect(output).not.toContain(clientSecret);
		expect(output).toContain('token request with ***');
	});

	it('should mask a secret inside a Basic auth header', () => {
		const header = `Basic ${Buffer.from(`my-client:${clientSecret}`).toString('base64')}`;

		const output = render(LogFormat.JSON, { message: 'request failed', data: { authorization: header } });

		expect(output).not.toContain(header);
		expect(output).toContain('Basic ***');
	});

	it('should keep Basic auth headers without secret', () => {
		const header = `Basic ${Buffer.from('user:not-a-registered-value').toString('base64')}`;

		const output = render(LogFormat.JSON, { message: `header ${header}` });

		expect(output).toContain(header);
	});

	it('should mask a secret that is escaped in JSON', () => {
		const secretWithQuote = 'secret"with\\quote';
		SecretRegistry.register(secretWithQuote);

		const output = render(LogFormat.JSON, { message: `value ${secretWithQuote}` });

		expect(output).toContain('value ***');
		expect(JSON.parse(output)).toEqual(expect.objectContaining({ message: 'value ***' }));
	});

	describe('when a secret is URL-encoded', () => {
		const base64Key = 'aB3+dE6/gH9=kL2+mN5/pQ8=';

		beforeEach(() => {
			SecretRegistry.register(base64Key);
		});

		it.each([
			['encodeURIComponent', encodeURIComponent(base64Key)],
			['URLSearchParams', new URLSearchParams({ key: base64Key }).toString().slice('key='.length)],
			['lower case hex', encodeURIComponent(base64Key).replace(/%[0-9A-F]{2}/g, (hex) => hex.toLowerCase())],
		])('should mask the secret encoded with %s', (_, encoded) => {
			const url = `https://example.com/files?key=${encoded}&id=1`;

			const output = render(LogFormat.JSON, { message: 'request failed', data: { url } });

			expect(output).not.toContain(encoded);
			expect(output).toContain('https://example.com/files?key=***&id=1');
		});
	});

	it('should keep text that is not a registered secret', () => {
		const output = render(LogFormat.JSON, { message: 'user created' });

		expect(JSON.parse(output)).toEqual(expect.objectContaining({ message: 'user created' }));
	});
});
