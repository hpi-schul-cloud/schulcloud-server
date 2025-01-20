import { Scope } from '@shared/repo/scope';
import { DeletionRequestEntity } from '../entity';
import { StatusModel } from '../../domain/types';

export class DeletionRequestScope extends Scope<DeletionRequestEntity> {
	byDeleteAfter(currentDate: Date): this {
		this.addQuery({ deleteAfter: { $lt: currentDate } });

		return this;
	}

	byStatusAndDate(status: StatusModel[], olderThan?: Date, newerThan?: Date): this {
		let query = { status: { $in: status } };
		if (olderThan) {
			const olderThanQuery = { updatedAt: { $lt: olderThan } };
			query = { ...query, ...olderThanQuery };
		}

		if (newerThan) {
			const newerThanQuery = { updatedAt: { $gte: newerThan } };
			query = { ...query, ...newerThanQuery };
		}

		this.addQuery(query);

		return this;
	}
}
