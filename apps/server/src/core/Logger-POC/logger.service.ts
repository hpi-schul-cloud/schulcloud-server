import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import util from 'util';
import { Logger as WinstonLogger } from 'winston';
import { Loggable } from './interfaces/loggable';

@Injectable()
/**
 * Default logger for server application.
 * Must implement ILogger but must not extend ConsoleLogger (this can be changed).
 * Transient injection: Wherever injected, a separate instance will be created, that can be provided with a custom context.
 */
export class LoggerPOC {
	constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger) {}

	log(loggable: Loggable): void {
		this.logger.log('info', this.createMessage(loggable));
	}

	warn(loggable: Loggable): void {
		this.logger.warn(this.createMessage(loggable));
	}

	debug(loggable: Loggable): void {
		this.logger.debug(this.createMessage(loggable));
	}

	verbose(loggable: Loggable): void {
		this.logger.verbose(this.createMessage(loggable));
	}

	http(loggable: Loggable): void {
		this.logger.http(this.createMessage(loggable));
	}

	error(loggable: Loggable): void {
		this.logger.error(this.createMessage(loggable));
	}

	private createMessage(loggable: Loggable) {
		const message = this.stringifiedMessage(loggable.getLogMessage());
		return message;
	}

	private stringifiedMessage(message: unknown) {
		const stringifiedMessage = util.inspect(message).replace(/\n/g, '').replace(/\\n/g, '');
		return stringifiedMessage;
	}
}
