import { InternalServerErrorException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { CommonCartridgeErrorEnum } from './error.enums';

export class IntendedUseNotSupportedLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly intendedUse: string) {
		super({
			type: CommonCartridgeErrorEnum.INTENDED_USE_NOT_SUPPORTED,
		});
	}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: CommonCartridgeErrorEnum.INTENDED_USE_NOT_SUPPORTED,
			stack: this.stack,
			data: {
				intendedUse: this.intendedUse,
				message: `Common Cartridge intended use ${this.intendedUse} is not supported`,
			},
		};

		return message;
	}
}
