import { Inject, Injectable, Optional, Scope } from '@nestjs/common';
import { INQUIRER, ModulesContainer } from '@nestjs/core';
import { Loggable } from '@shared/common/loggable';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { getLogOrigin, type LogOrigin } from './log-origin';
import { LoggingUtils } from './logging.utils';
import { type LogMessageWithContext } from './types';

// ErrorLogger may only be used in the ErrorModule. Do not use it in other modules!
// Transient like Logger, so entries get the class and module using it as context and module.
@Injectable({ scope: Scope.TRANSIENT })
export class ErrorLogger {
	private readonly origin: LogOrigin;

	constructor(
		@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
		@Optional() @Inject(INQUIRER) inquirer?: object | null,
		@Optional() modulesContainer?: ModulesContainer
	) {
		this.origin = getLogOrigin(inquirer, modulesContainer, (value) => value instanceof ErrorLogger);
	}

	public emerg(loggable: Loggable): void {
		this.logger.emerg(this.createLogEntry(loggable));
	}

	public alert(loggable: Loggable): void {
		this.logger.alert(this.createLogEntry(loggable));
	}

	public crit(loggable: Loggable): void {
		this.logger.crit(this.createLogEntry(loggable));
	}

	public error(loggable: Loggable): void {
		this.logger.error(this.createLogEntry(loggable));
	}

	private createLogEntry(loggable: Loggable): LogMessageWithContext {
		const logEntry = LoggingUtils.createMessageWithContext(loggable, this.origin.context);

		return this.origin.module ? { ...logEntry, module: this.origin.module } : logEntry;
	}
}
