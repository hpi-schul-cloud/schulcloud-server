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

	describe('when the log format is pretty', () => {
		it('should write the entry in the readable nest format', () => {
			const output = render(LogFormat.PRETTY, { message: 'user created', context: 'UserService' });

			expect(output).toContain('[UserService]');
			expect(output).toContain('user created');
			expect(() => JSON.parse(output) as unknown).toThrow();
		});
	});
});
