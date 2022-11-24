import { BaseEntity, EntityId } from '@shared/domain';

type LogDataType = BaseEntity | EntityId;

// if we wanted a generic Loggable, it could look somewhat like this. But I, Thomas, dont think we should have one.
export class DefaultLoggable {
	data: { [key: string]: LogDataType };

	message: string;

	constructor(message: string, data: { [key: string]: LogDataType }) {
		this.message = message;
		this.data = data;
	}

	getLogMessage() {
		const result = {
			message: this.message,
			data: {},
		};
		Object.entries(this.data).forEach(([key, value]) => {
			if (value instanceof BaseEntity) {
				result.data[key] = value.id;
			}
			result.data[key] = value;
		});

		return result;
	}
}
