import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { DeletionLogStatistic } from '../uc/interface';

export class DeletionLogStatisticBuilder {
	static build(domain: DeletionDomainModel, modifiedCount?: number, deletedCount?: number): DeletionLogStatistic {
		const deletionLogStatistic = { domain, modifiedCount, deletedCount };

		return deletionLogStatistic;
	}
}
