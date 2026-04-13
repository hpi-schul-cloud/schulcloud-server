import { Loggable, LogMessage } from '@core/logger';
import { RuntimeConfigValueType } from '@infra/runtime-config';

export class UpdateRuntimeConfigLoggable implements Loggable {
	constructor(
		private readonly userId: string,
		private readonly key: string,
		private readonly givenValue: RuntimeConfigValueType,
		private readonly persistedValue: RuntimeConfigValueType
	) {}

	public getLogMessage(): LogMessage {
		const message = {
			message: `Runtime config updated`,
			data: { userId: this.userId, key: this.key, givenValue: this.givenValue, persistedValue: this.persistedValue },
		};

		return message;
	}
}
