import { EntityDictionary } from '@mikro-orm/core';
import { IFindOptions, SortOrder, SortOrderNumberType } from '../domain/interface';

export abstract class MongoDbScope<T> {
	protected pipeline: unknown[] = [];

	constructor(protected options?: IFindOptions<T>) {}

	build(): unknown[] {
		const optionsPipeline: unknown[] = [];

		if (this.options?.order) {
			const sortObject: SortOrderNumberType = Object.fromEntries(
				Object.entries(this.options?.order).map(([key, value]) => [key, value === SortOrder.asc ? 1 : -1])
			);

			optionsPipeline.push({ $sort: sortObject });
		}

		optionsPipeline.push({ $skip: this.options?.pagination?.skip || 0 });

		if (this.options?.pagination?.limit) {
			optionsPipeline.push({ $limit: this.options.pagination.limit });
		}

		this.pipeline.push({
			$facet: {
				total: [{ $count: 'count' }],
				data: optionsPipeline,
			},
		});

		return this.pipeline;
	}
}

export type ScopeAggregateResult<T> = [{ total: [{ count: number }]; data: EntityDictionary<T>[] }];
