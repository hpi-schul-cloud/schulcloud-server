import { Scope } from '@shared/repo';
import { DeletionRequestEntity } from '../entity';
import { DeletionStatusModel } from '../domain/types';

export class DeletionRequestScope extends Scope<DeletionRequestEntity> {
	byDeleteAfter(currentDate: Date): DeletionRequestScope {
		this.addQuery({ deleteAfter: { $lt: currentDate } });

		return this;
	}

	byStatus(): DeletionRequestScope {
		this.addQuery({ status: [DeletionStatusModel.REGISTERED, DeletionStatusModel.FAILED] });

		return this;
	}
}
