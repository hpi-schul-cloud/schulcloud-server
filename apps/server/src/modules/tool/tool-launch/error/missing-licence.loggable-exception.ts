import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { EntityId } from '@shared/domain/types';
import { ContextExternalToolLaunchable } from '../../context-external-tool/domain';

export class MissingMediaLicenseLoggableException extends BusinessError implements Loggable {
	constructor(
		private readonly medium: ExternalToolMedium,
		private readonly userId: EntityId,
		private readonly contextExternalTool: ContextExternalToolLaunchable
	) {
		super(
			{
				type: 'MISSING_MEDIA_LICENSE',
				title: 'Missing media license',
				defaultMessage: 'The user does not have the required license to launch this medium.',
			},
			HttpStatus.FORBIDDEN
		);
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				medium: {
					status: this.medium.status,
					mediumId: this.medium.mediumId,
					publisher: this.medium.publisher,
				},
				userId: this.userId,
				contextExternalToolId: this.contextExternalTool.id,
				schoolExternalToolId: this.contextExternalTool.schoolToolRef.schoolToolId,
				contextType: this.contextExternalTool.contextRef.type,
				contextId: this.contextExternalTool.contextRef.id,
			},
		};
	}
}
