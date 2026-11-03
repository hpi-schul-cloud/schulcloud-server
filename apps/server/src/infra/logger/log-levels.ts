import winston from 'winston';
import { type SyslogLevel } from './logger.config';

export type LogLevels = {
	defaultLevel: SyslogLevel;
	// keyed by module or class name
	overrides: Map<string, SyslogLevel>;
};

/**
 * Parses LOG_LEVELS, e.g. "default=notice,BoardModule=debug". The value is validated by LoggerConfig beforehand.
 */
export const parseLogLevels = (value: string | undefined, fallbackLevel: SyslogLevel): LogLevels => {
	const overrides = new Map<string, SyslogLevel>();
	let defaultLevel = fallbackLevel;

	for (const rule of (value ?? '').split(',')) {
		const [name, level] = rule.split('=').map((part) => part.trim());
		if (!name || !level) {
			continue;
		}

		if (name === 'default') {
			defaultLevel = level as SyslogLevel;
		} else {
			overrides.set(name, level as SyslogLevel);
		}
	}

	return { defaultLevel, overrides };
};

// winston syslog levels: emerg = 0 ... debug = 7, a higher number is more verbose
const severity = (level: string): number => winston.config.syslog.levels[level] ?? -1;

export const getMostVerboseLevel = ({ defaultLevel, overrides }: LogLevels): SyslogLevel =>
	[defaultLevel, ...overrides.values()].reduce((mostVerbose, level) =>
		severity(level) > severity(mostVerbose) ? level : mostVerbose
	);
