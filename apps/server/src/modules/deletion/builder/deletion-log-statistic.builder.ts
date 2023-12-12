import { DeletionDomainModel } from '../domain/types';
import { DeletionLogStatistic } from '../interface';

export class DeletionLogStatisticBuilder {
	static build(domain: DeletionDomainModel, modifiedCount?: number, deletedCount?: number): DeletionLogStatistic {
		const deletionLogStatistic = { domain, modifiedCount, deletedCount };

		return deletionLogStatistic;
	}
}
