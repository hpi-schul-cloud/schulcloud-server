import { BadRequestException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class ToolStatusOutdatedLoggableException extends BadRequestException implements Loggable {
	constructor(private readonly userId: EntityId, private readonly toolId: EntityId) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'TOOL_STATUS_OUTDATED',
			message: 'The status of the tool is outdated and cannot be launched by the user.',
			stack: this.stack,
			data: {
				userId: this.userId,
				toolId: this.toolId,
			},
		};
	}
}
