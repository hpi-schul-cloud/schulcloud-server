import { type MediumIdentifier } from '@modules/media-source';
import { type ExternalTool } from '@modules/tool/external-tool/domain';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class ExternalToolCreatedLoggable implements Loggable {
	constructor(
		private readonly userId: string,
		private readonly schoolId: string,
		private readonly license: MediumIdentifier,
		private readonly externalTool: ExternalTool
	) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'An external tool was automatically created for a licensed medium',
			data: {
				userId: this.userId,
				schoolId: this.schoolId,
				mediumId: this.license.mediumId,
				mediaSourceId: this.license.mediaSource?.sourceId,
				ExternalToolId: this.externalTool.id,
			},
		};
	}
}
