import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { HttpStatus } from '@nestjs/common';
import { SchoolExternalTool } from '../index';
import { ToolContextType } from '../../../common/enum';

export class SchoolExternalToolInvalidAvailableContextsException extends BusinessError implements Loggable {
	constructor(
		private readonly schoolExternalTool: SchoolExternalTool,
		private readonly validContexts: ToolContextType[]
	) {
		super(
			{
				type: 'SCHOOL_EXTERNAL_TOOL_INVALID_AVAILABLE_CONTEXTS',
				title: 'School external tool has invalid available contexts',
				defaultMessage: 'The available contexts of school external tool has one or more invalid contexts',
			},
			HttpStatus.BAD_REQUEST,
			{
				schoolExternalToolId: schoolExternalTool.id,
				schoolExternalToolName: schoolExternalTool.name,
				schoolExternalToolAvailableContexts: schoolExternalTool.availableContexts.join(', '),
				validContexts: validContexts.join(', '),
			}
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				schoolExternalToolId: this.schoolExternalTool.id,
				schoolExternalToolName: this.schoolExternalTool.name,
				schoolExternalToolAvailableContexts: this.schoolExternalTool.availableContexts.join(', '),
				validContexts: this.validContexts.join(', '),
			},
		};
	}
}
