import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { MediumIdentifier } from '@modules/media-source';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';

export class SchoolExternalToolCreatedLoggable implements Loggable {
	constructor(
		private readonly userId: string,
		private readonly license: MediumIdentifier,
		private readonly schoolExternalTool: SchoolExternalTool
	) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'A school external tool was automatically created for a licensed medium',
			data: {
				userId: this.userId,
				schoolId: this.schoolExternalTool.schoolId,
				mediumId: this.license.mediumId,
				mediaSourceId: this.license.mediaSource?.sourceId,
				schoolExternalToolId: this.schoolExternalTool.id,
			},
		};
	}
}
