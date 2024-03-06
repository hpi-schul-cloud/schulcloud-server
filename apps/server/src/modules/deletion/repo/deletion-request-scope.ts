import { Scope } from '@shared/repo';
import { DeletionRequestEntity } from '../entity';
import { DeletionStatusModel } from '../domain/types';

export class DeletionRequestScope extends Scope<DeletionRequestEntity> {
	byDeleteAfter(currentDate: Date): DeletionRequestScope {
		this.addQuery({ deleteAfter: { $lt: currentDate } });

		return this;
	}

	byStatus(fifteenMinutesAgo: Date): DeletionRequestScope {
		this.addQuery({
			$or: [
				{ status: DeletionStatusModel.FAILED },
				{
					$and: [
						{ status: [DeletionStatusModel.REGISTERED, DeletionStatusModel.PENDING] },
						{ updatedAt: { $lt: fifteenMinutesAgo } },
					],
				},
			],
		});

		return this;
	}
}
