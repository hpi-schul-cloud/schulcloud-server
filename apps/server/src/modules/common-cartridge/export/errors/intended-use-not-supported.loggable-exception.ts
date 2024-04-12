import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';
import { CommonCartridgeErrorEnum } from './error.enum';

export class IntendedUseNotSupportedLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly intendedUse: string) {
		super({
			type: CommonCartridgeErrorEnum.INTENDED_USE_NOT_SUPPORTED,
		});
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
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
