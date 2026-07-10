import { InternalServerErrorException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { CommonCartridgeErrorEnum } from './error.enums';

export class ResourceTypeNotSupportedLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly type: string) {
		super({
			type: CommonCartridgeErrorEnum.RESOURCE_TYPE_NOT_SUPPORTED,
		});
	}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: CommonCartridgeErrorEnum.RESOURCE_TYPE_NOT_SUPPORTED,
			stack: this.stack,
			data: {
				type: this.type,
				message: `Common Cartridge resource type ${this.type} is not supported`,
			},
		};

		return message;
	}
}
