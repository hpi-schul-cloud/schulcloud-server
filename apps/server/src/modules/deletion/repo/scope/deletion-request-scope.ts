import { Scope } from '@shared/repo/scope';
import { FilterQuery } from '@mikro-orm/core';
import { DeletionRequestEntity } from '../entity';
import { StatusModel } from '../../domain/types';

export class DeletionRequestScope extends Scope<DeletionRequestEntity> {
	byDeleteAfter(currentDate: Date): this {
		this.addQuery({ deleteAfter: { $lt: currentDate } });

		return this;
	}

	byStatusAndDate(status: StatusModel[], olderThan?: Date, newerThan?: Date): this {
		const query: FilterQuery<DeletionRequestEntity> = { status: { $in: status } };

		const dateConditions: FilterQuery<DeletionRequestEntity>[] = [];
		if (olderThan) {
			dateConditions.push({ updatedAt: { $lt: olderThan } });
		}
		if (newerThan) {
			dateConditions.push({ updatedAt: { $gte: newerThan } });
		}

		if (dateConditions.length > 0) {
			query.$and = dateConditions;
		}

		this.addQuery(query);
		return this;
	}
}
