import { type MediumIdentifier } from '@modules/media-source';
import { type SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class SchoolExternalToolCreatedLoggable implements Loggable {
	constructor(
		private readonly userId: string,
		private readonly license: MediumIdentifier,
		private readonly schoolExternalTool: SchoolExternalTool
	) {}

	public getLogMessage(): LoggableMessage {
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
