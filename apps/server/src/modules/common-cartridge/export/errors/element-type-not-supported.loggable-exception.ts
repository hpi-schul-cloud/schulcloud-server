import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';
import { CommonCartridgeErrorEnum } from './error.enum';

export class ElementTypeNotSupportedLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly type: string) {
		super({
			type: CommonCartridgeErrorEnum.ELEMENT_TYPE_NOT_SUPPORTED,
		});
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: CommonCartridgeErrorEnum.ELEMENT_TYPE_NOT_SUPPORTED,
			stack: this.stack,
			data: {
				type: this.type,
				message: `Common Cartridge element type ${this.type} is not supported`,
			},
		};

		return message;
	}
}
