import { ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class MissingLicenceLoggableException extends BusinessError implements Loggable {
	constructor(
		private readonly medium: ExternalToolMedium,
		private readonly userId: EntityId,
		private readonly contextExternalToolId?: string
	) {
		super(
			{
				type: 'MISSING_LICENCE',
				title: 'Missing licence',
				defaultMessage: 'The user does not have the required licence to launch this medium.',
			},
			HttpStatus.FORBIDDEN
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				medium: { mediumId: this.medium.mediumId, publisher: this.medium.publisher },
				userId: this.userId,
				contextExternalToolId: this.contextExternalToolId,
			},
		};
	}
}
