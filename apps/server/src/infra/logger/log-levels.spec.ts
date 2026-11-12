import { validateSync } from 'class-validator';
import { createLevelFilter, getMostVerboseLevel, parseLogLevels } from './log-levels';
import { LoggerConfig, SyslogLevel } from './logger.config';

describe('parseLogLevels', () => {
	it('should use the fallback level when nothing is configured', () => {
		const result = parseLogLevels(undefined, SyslogLevel.NOTICE);

		expect(result).toEqual({ defaultLevel: SyslogLevel.NOTICE, overrides: new Map() });
	});

	it('should read the default and the levels per module or class', () => {
		const result = parseLogLevels(' default=info , BoardModule=debug,BoardService = warning', SyslogLevel.NOTICE);

		expect(result).toEqual({
			defaultLevel: SyslogLevel.INFO,
			overrides: new Map([
				['BoardModule', SyslogLevel.DEBUG],
				['BoardService', SyslogLevel.WARNING],
			]),
		});
	});

	it('should keep the fallback level when only modules are configured', () => {
		const result = parseLogLevels('BoardModule=debug', SyslogLevel.NOTICE);

		expect(result.defaultLevel).toBe(SyslogLevel.NOTICE);
	});
});

describe('getMostVerboseLevel', () => {
	it('should return the most verbose of all configured levels', () => {
		const result = getMostVerboseLevel(parseLogLevels('default=warning,BoardModule=debug', SyslogLevel.NOTICE));

		expect(result).toBe(SyslogLevel.DEBUG);
	});

	it('should return the default level without overrides', () => {
		const result = getMostVerboseLevel(parseLogLevels(undefined, SyslogLevel.ERROR));

		expect(result).toBe(SyslogLevel.ERROR);
	});
});

describe('LoggerConfig LOG_LEVELS validation', () => {
	const validate = (logLevels: string): string[] => {
		const config = new LoggerConfig();
		config.logLevels = logLevels;

		return validateSync(config).flatMap((error) => Object.values(error.constraints ?? {}));
	};

	it('should accept a valid value', () => {
		expect(validate('default=notice, BoardModule=debug')).toEqual([]);
	});

	it('should accept an empty value', () => {
		expect(validate('')).toEqual([]);
	});

	it('should reject an unknown level with a clear message', () => {
		expect(validate('BoardModule=verbose')).toEqual([expect.stringMatching(/^LOG_LEVELS must look like/)]);
	});

	it('should reject a rule without level', () => {
		expect(validate('BoardModule')).toEqual([expect.stringMatching(/^LOG_LEVELS must look like/)]);
	});
});

describe('createLevelFilter', () => {
	const passes = (logLevels: string, info: { level: string; context?: string; module?: string }): boolean => {
		const filter = createLevelFilter(parseLogLevels(logLevels, SyslogLevel.NOTICE));

		return filter.transform({ message: 'test', ...info }) !== false;
	};

	it('should apply the default level', () => {
		expect(passes('default=notice', { level: 'notice' })).toBe(true);
		expect(passes('default=notice', { level: 'info' })).toBe(false);
	});

	it('should apply the level of the module', () => {
		const logLevels = 'default=notice,BoardModule=debug';

		expect(passes(logLevels, { level: 'debug', context: 'BoardService', module: 'BoardModule' })).toBe(true);
		expect(passes(logLevels, { level: 'debug', context: 'UserService', module: 'UserModule' })).toBe(false);
	});

	it('should prefer the level of the class over the level of the module', () => {
		const logLevels = 'default=notice,BoardModule=debug,BoardService=warning';

		expect(passes(logLevels, { level: 'info', context: 'BoardService', module: 'BoardModule' })).toBe(false);
		expect(passes(logLevels, { level: 'info', context: 'CardService', module: 'BoardModule' })).toBe(true);
	});

	it('should apply the level of a context without module, e.g. from Nest itself', () => {
		expect(passes('default=info,InstanceLoader=warning', { level: 'info', context: 'InstanceLoader' })).toBe(false);
	});
});
