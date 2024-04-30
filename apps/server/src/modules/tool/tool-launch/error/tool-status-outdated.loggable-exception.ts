import { BadRequestException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class ToolStatusOutdatedLoggableException extends BadRequestException implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly toolId: EntityId,
		private readonly isOutdatedOnScopeSchool: boolean,
		private readonly isOutdatedOnScopeContext: boolean,
		private readonly isIncompleteOnScopeContext: boolean,
		private readonly isIncompleteOperationalOnScopeContext: boolean,
		private readonly isDeactivated: boolean
	) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			// TODO refactor exception to status not launchable
			type: 'TOOL_STATUS_OUTDATED',
			message: 'The status of the tool is outdated and cannot be launched by the user.',
			stack: this.stack,
			data: {
				userId: this.userId,
				toolId: this.toolId,
				isOutdatedOnScopeSchool: this.isOutdatedOnScopeSchool,
				isOutdatedOnScopeContext: this.isOutdatedOnScopeContext,
				isIncompleteOnScopeContext: this.isIncompleteOnScopeContext,
				isIncompleteOperationalOnScopeContext: this.isIncompleteOperationalOnScopeContext,
				isDeactivated: this.isDeactivated,
			},
		};
	}
}
