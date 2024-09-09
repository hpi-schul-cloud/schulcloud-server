import { ErrorLogMessage, LogMessage, Loggable, ValidationErrorLogMessage } from '@src/core/logger';
import { SyncStrategyTarget } from '../sync-strategy.types';

export class InvalidTargetLoggable implements Loggable {
	constructor(private readonly target: string) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Either synchronization is not activated or the target entered is invalid',
			data: {
				enteredTarget: this.target,
				avaliableTargets: SyncStrategyTarget,
			},
		};
	}
}
