import { DomainOperation } from '@shared/domain/interface';
import { DomainModel } from '@shared/domain/types';

export class DeletionLogStatisticBuilder {
	static build(domain: DomainModel, modifiedCount?: number, deletedCount?: number): DomainOperation {
		const deletionLogStatistic = { domain, modifiedCount, deletedCount };

		return deletionLogStatistic;
	}
}
