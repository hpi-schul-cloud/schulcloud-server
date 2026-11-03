import { utilities } from 'nest-winston';
import winston from 'winston';
import { LogFormat } from './logger.config';

const createPrettyFormat = (): winston.Logform.Format =>
	winston.format.combine(
		winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
		winston.format.ms(),
		utilities.format.nestLike()
	);

const createJsonFormat = (): winston.Logform.Format =>
	winston.format.combine(winston.format.timestamp(), winston.format.json());

export const createLogFormat = (logFormat: LogFormat): winston.Logform.Format =>
	logFormat === LogFormat.PRETTY ? createPrettyFormat() : createJsonFormat();
