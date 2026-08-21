import { type MediumIdentifier } from '@modules/media-source';
import { type EntityId } from '@shared/domain/types';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { isError } from 'lodash';

export class ExternalToolProvisioningFailedLoggable implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly schoolId: EntityId,
		private readonly license: MediumIdentifier,
		private readonly error: unknown
	) {}

	public getLogMessage(): LoggableMessage {
		const error = isError(this.error)
			? {
					name: this.error.name,
					message: this.error.message,
				}
			: 'Unknown error';

		return {
			message: 'Provisioning external tool for licensed medium failed.',
			data: {
				userId: this.userId,
				schoolId: this.schoolId,
				mediumId: this.license.mediumId,
				mediaSourceId: this.license.mediaSource?.sourceId,
				error,
			},
		};
	}
}
