import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { SyncStrategyTarget } from '../sync-strategy.types';

export class InvalidTargetLoggable implements Loggable {
	constructor(private readonly target: string) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Either synchronization is not activated or the target entered is invalid',
			data: {
				enteredTarget: this.target,
				availableTargets: SyncStrategyTarget,
			},
		};
	}
}
