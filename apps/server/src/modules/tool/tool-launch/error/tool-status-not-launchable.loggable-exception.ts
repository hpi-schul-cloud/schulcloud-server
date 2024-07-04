import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class ToolStatusNotLaunchableLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly toolId: EntityId,
		private readonly isOutdatedOnScopeSchool: boolean,
		private readonly isOutdatedOnScopeContext: boolean,
		private readonly isIncompleteOnScopeContext: boolean,
		private readonly isIncompleteOperationalOnScopeContext: boolean,
		private readonly isDeactivated: boolean,
		private readonly isNotLicensed: boolean
	) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'TOOL_STATUS_NOT_LAUNCHABLE',
			message: 'The status of the tool cannot be launched by the user.',
			stack: this.stack,
			data: {
				userId: this.userId,
				toolId: this.toolId,
				isOutdatedOnScopeSchool: this.isOutdatedOnScopeSchool,
				isOutdatedOnScopeContext: this.isOutdatedOnScopeContext,
				isIncompleteOnScopeContext: this.isIncompleteOnScopeContext,
				isIncompleteOperationalOnScopeContext: this.isIncompleteOperationalOnScopeContext,
				isDeactivated: this.isDeactivated,
				isNotLicensed: this.isNotLicensed,
			},
		};
	}
}
