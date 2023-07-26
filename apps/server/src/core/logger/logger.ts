import { Inject, Injectable, Scope } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { Loggable } from './interfaces';
import { LoggingUtils } from './logging.utils';

type ChildOptions = { context?: string; level?: string };

@Injectable({ scope: Scope.TRANSIENT })
export class Logger {
	private context = '';

	constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger) {}

	public log(loggable: Loggable): void {
		const message = LoggingUtils.createMessageWithContext(loggable, this.context);
		this.logger.info(message);
	}

	public warn(loggable: Loggable): void {
		const message = LoggingUtils.createMessageWithContext(loggable, this.context);
		this.logger.warning(message);
	}

	public debug(loggable: Loggable): void {
		const message = LoggingUtils.createMessageWithContext(loggable, this.context);
		this.logger.debug(message);
	}

	public verbose(loggable: Loggable): void {
		const message = LoggingUtils.createMessageWithContext(loggable, this.context);
		this.logger.verbose(message);
	}

	public setContext(name: string) {
		this.context = name;
	}

	public createChild(options: ChildOptions): Logger {
		const child = this.logger.child({});
		child.level = options.level || this.logger.level;
		const logger = new Logger(child);
		logger.setContext(options.context || this.context);
		return logger;
	}
}
