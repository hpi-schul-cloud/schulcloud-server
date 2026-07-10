import { type RuntimeConfigValueType } from '@infra/runtime-config';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class UpdateRuntimeConfigLoggable implements Loggable {
	constructor(
		private readonly userId: string,
		private readonly key: string,
		private readonly givenValue: RuntimeConfigValueType,
		private readonly persistedValue: RuntimeConfigValueType
	) {}

	public getLogMessage(): LoggableMessage {
		const message = {
			message: `Runtime config updated`,
			data: { userId: this.userId, key: this.key, givenValue: this.givenValue, persistedValue: this.persistedValue },
		};

		return message;
	}
}
