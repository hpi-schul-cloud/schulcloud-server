import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';
import { type ContextExternalToolConfigurationStatus } from '../../common/domain';
import { type ContextExternalToolLaunchable } from '../../context-external-tool/domain';

export class ToolStatusNotLaunchableLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly contextExternalTool: ContextExternalToolLaunchable,
		private readonly configStatus: ContextExternalToolConfigurationStatus
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'TOOL_STATUS_NOT_LAUNCHABLE',
			message: 'The status of the tool cannot be launched by the user.',
			stack: this.stack,
			data: {
				userId: this.userId,
				contextExternalToolId: this.contextExternalTool.id,
				schoolExternalToolId: this.contextExternalTool.schoolToolRef.schoolToolId,
				status: { ...this.configStatus },
			},
		};
	}
}
