import { Scope } from '@shared/repo/scope';
import { DeletionRequestEntity } from '../entity';
import { StatusModel } from '../../domain/types';

export class DeletionRequestScope extends Scope<DeletionRequestEntity> {
	byDeleteAfter(currentDate: Date): this {
		this.addQuery({ deleteAfter: { $lt: currentDate } });

		return this;
	}

	byStatus(status: StatusModel, olderThan: Date): this {
		if (olderThan) {
			this.addQuery({ $and: [{ status }, { updatedAt: { $lt: olderThan } }] });
		} else {
			this.addQuery({ status });
		}

		return this;
	}
}
