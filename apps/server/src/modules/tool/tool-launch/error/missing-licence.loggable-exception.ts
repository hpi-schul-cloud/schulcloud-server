import { ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { PseudoContextExternalTool } from '../domain/pseudo-context-external-tool';

export class MissingMediaLicenseLoggableException extends BusinessError implements Loggable {
	constructor(
		private readonly medium: ExternalToolMedium,
		private readonly userId: EntityId,
		private readonly contextExternalTool: ContextExternalTool | PseudoContextExternalTool
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

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				medium: {
					mediumId: this.medium.mediumId,
					publisher: this.medium.publisher,
				},
				userId: this.userId,
				schoolExternalToolId: this.contextExternalTool.schoolToolRef.schoolToolId,
				contextType: this.contextExternalTool.contextRef.type,
				contextId: this.contextExternalTool.contextRef.id,
			},
		};
	}
}
