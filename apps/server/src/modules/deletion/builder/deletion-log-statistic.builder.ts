import { DomainOperation } from '@shared/domain/interface';
import { DomainModel } from '@shared/domain/types';

export class DeletionLogStatisticBuilder {
	static build(
		domain: DomainModel,
		modifiedCount: number,
		deletedCount: number,
		modifiedRef?: string[],
		deletedRef?: string[]
	): DomainOperation {
		const deletionLogStatistic = { domain, modifiedCount, deletedCount, modifiedRef, deletedRef };

		return deletionLogStatistic;
	}
}
