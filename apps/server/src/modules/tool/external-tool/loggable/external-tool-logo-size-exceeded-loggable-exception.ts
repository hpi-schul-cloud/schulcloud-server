import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class ExternalToolLogoSizeExceededLoggableException extends BusinessError implements Loggable {
	constructor(
		private readonly externalToolId: string | undefined,
		private readonly maxExternalToolLogoSizeInBytes: number
	) {
		super(
			{
				type: 'EXTERNAL_TOOL_LOGO_SIZE_EXCEEDED',
				title: 'External tool logo size exceeded.',
				defaultMessage: 'External tool logo size exceeded.',
			},
			HttpStatus.BAD_REQUEST
		);
	}

	getLogMessage(): LoggableMessage {
		return {
			type: 'EXTERNAL_TOOL_LOGO_SIZE_EXCEEDED',
			message: 'External tool logo size exceeded',
			stack: this.stack,
			data: {
				externalToolId: this.externalToolId,
				maxExternalToolLogoSizeInBytes: this.maxExternalToolLogoSizeInBytes,
			},
		};
	}
}
