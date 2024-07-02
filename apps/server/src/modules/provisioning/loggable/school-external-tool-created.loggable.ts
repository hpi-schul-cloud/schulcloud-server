import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { MediaUserLicense } from '@modules/user-license';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class SchoolExternalToolCreatedLoggable implements Loggable {
	constructor(private readonly license: MediaUserLicense, private readonly schoolExternalTool: SchoolExternalTool) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'A school external tool was automatically created for a licensed medium',
			data: {
				userId: this.license.userId,
				schoolId: this.schoolExternalTool.schoolId,
				mediumId: this.license.mediumId,
				mediaSourceId: this.license.mediaSource?.sourceId,
				schoolExternalToolId: this.schoolExternalTool.id,
			},
		};
	}
}
