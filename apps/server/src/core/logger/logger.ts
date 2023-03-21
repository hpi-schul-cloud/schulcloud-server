import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { Loggable } from './loggable';
import { LoggingUtils } from './logging.utils';

export class Logger {
	private context = '';

	constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger) {}

	public log(loggable: Loggable): void {
		const message = LoggingUtils.createMessageWithContext(loggable, this.context);
		this.logger.info(message);
	}

	public warn(loggable: Loggable): void {
		const message = LoggingUtils.createMessageWithContext(loggable, this.context);
		this.logger.warn(message);
	}

	public debug(loggable: Loggable): void {
		const message = LoggingUtils.createMessageWithContext(loggable, this.context);
		this.logger.debug(message);
	}

	public verbose(loggable: Loggable): void {
		const message = LoggingUtils.createMessageWithContext(loggable, this.context);
		this.logger.verbose(message);
	}

	public http(loggable: Loggable): void {
		const message = LoggingUtils.createMessageWithContext(loggable, this.context);
		this.logger.notice(message);
	}

	public setContext(name: string) {
		this.context = name;
	}
}
