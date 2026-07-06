import { ErrorLogMessage, Loggable } from '@infra/logger';
import { InternalServerErrorException } from '@nestjs/common';
import { CommonCartridgeErrorEnum } from './error.enums';

export class VersionNotSupportedLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly version: string) {
		super({
			type: CommonCartridgeErrorEnum.VERSION_NOT_SUPPORTED,
		});
	}

	public getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: CommonCartridgeErrorEnum.VERSION_NOT_SUPPORTED,
			stack: this.stack,
			data: {
				version: this.version,
				message: `Common Cartridge version ${this.version} is not supported`,
			},
		};

		return message;
	}
}
