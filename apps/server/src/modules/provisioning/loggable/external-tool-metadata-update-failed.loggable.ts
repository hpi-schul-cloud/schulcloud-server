import { Loggable, LogMessage } from '@core/logger';
import { MediumIdentifier } from '@modules/media-source';
import { ExternalTool } from '@modules/tool';
import { isError } from 'lodash';

export class ExternalToolMetadataUpdateFailedLoggable implements Loggable {
	constructor(
		private readonly externalTool: ExternalTool,
		private readonly medium: MediumIdentifier,
		private readonly error: unknown
	) {}

	public getLogMessage(): LogMessage {
		const error = isError(this.error)
			? {
					name: this.error.name,
					message: this.error.message,
			  }
			: 'Unknown error';

		return {
			message: 'Updating external tool with medium metadata failed.',
			data: {
				externalToolId: this.externalTool.id,
				mediumId: this.medium.mediumId,
				mediaSourceId: this.medium.mediaSource?.sourceId,
				error,
			},
		};
	}
}
