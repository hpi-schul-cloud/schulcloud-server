// we have an clash betwenn winston logger (legacy server) that is configured for syslog with syslog levels
// and the exposed logger in nest
export enum LogLevels {
	emerg = 'emerg',
	alert = 'alert',
	crit = 'crit',
	error = 'error',
	warning = 'warning',
	notice = 'notice',
	info = 'info',
	debug = 'debug',
}

export interface ILoggerConfig {
	LOG_LEVEL: string | LogLevels;
}
