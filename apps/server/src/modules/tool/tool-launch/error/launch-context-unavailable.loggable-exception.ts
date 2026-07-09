import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';
import { type ContextExternalToolLaunchable } from '../../context-external-tool/domain';

export class LaunchContextUnavailableLoggableException extends BusinessError implements Loggable {
	constructor(
		private readonly contextExternalTool: ContextExternalToolLaunchable,
		private readonly userId: EntityId
	) {
		super(
			{
				type: 'LAUNCH_CONTEXT_UNAVAILABLE',
				title: 'Launch context unavailable',
				defaultMessage: 'The context type cannot launch school external tools',
			},
			HttpStatus.FORBIDDEN
		);
	}

	public getLogMessage(): LoggableMessage {
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
