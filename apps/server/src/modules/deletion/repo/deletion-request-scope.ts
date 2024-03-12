import { Scope } from '@shared/repo';
import { DeletionRequestEntity } from '../entity';
import { StatusModel } from '../types';

export class DeletionRequestScope extends Scope<DeletionRequestEntity> {
	byDeleteAfter(currentDate: Date): DeletionRequestScope {
		this.addQuery({ deleteAfter: { $lt: currentDate } });

		return this;
	}

	byStatus(fifteenMinutesAgo: Date): DeletionRequestScope {
		this.addQuery({
			$or: [
				{ status: StatusModel.FAILED },
				{
					$and: [{ status: [StatusModel.REGISTERED, StatusModel.PENDING] }, { updatedAt: { $lt: fifteenMinutesAgo } }],
				},
			],
		});

		return this;
	}
}
