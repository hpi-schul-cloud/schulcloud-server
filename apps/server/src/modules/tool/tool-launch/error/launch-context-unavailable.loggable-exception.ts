import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { ContextExternalToolLaunchable } from '../../context-external-tool/domain';

export class LaunchContextUnavailableLoggableException extends BusinessError implements Loggable {
	constructor(private readonly contextExternalTool: ContextExternalToolLaunchable, private readonly userId: EntityId) {
		super(
			{
				type: 'LAUNCH_CONTEXT_UNAVAILABLE',
				title: 'Launch context unavailable',
				defaultMessage: 'The context type cannot launch school external tools',
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
				userId: this.userId,
				schoolExternalToolId: this.contextExternalTool.schoolToolRef.schoolToolId,
				contextType: this.contextExternalTool.contextRef.type,
				contextId: this.contextExternalTool.contextRef.id,
			},
		};
	}
}
