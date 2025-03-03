import { EntityId } from '@shared/domain/types';

import { DomainDeletionReport } from '../interface';

export class UserDeletedCommand {
	constructor(
		public readonly deletionRequestId: EntityId,
		public readonly domainDeletionReport: DomainDeletionReport
	) {}
}
