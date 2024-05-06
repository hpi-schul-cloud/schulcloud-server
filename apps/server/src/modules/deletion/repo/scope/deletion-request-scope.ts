import { Scope } from '@shared/repo';
import { DeletionRequestEntity } from '../entity';
import { StatusModel } from '../../domain/types';

export class DeletionRequestScope extends Scope<DeletionRequestEntity> {
	byDeleteAfter(currentDate: Date): this {
		this.addQuery({ deleteAfter: { $lt: currentDate } });

		return this;
	}

	byStatus(fifteenMinutesAgo: Date): this {
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

	byStatusPending(): this {
		this.addQuery({ status: [StatusModel.PENDING] });

		return this;
	}
}
