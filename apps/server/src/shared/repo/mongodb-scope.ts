import { type IFindOptions, SortOrder, type SortOrderNumberType } from '../domain/interface';

export abstract class MongoDbScope<T> {
	protected pipeline: Record<string, unknown>[] = [];

	constructor(protected options?: IFindOptions<T>) {}

	public buildDataPipeline(): Record<string, unknown>[] {
		return [...this.pipeline, ...this.buildOptionsPipeline()];
	}

	public buildCountPipeline(): Record<string, unknown>[] {
		return [...this.pipeline, { $count: 'count' }];
	}

	public build(): Record<string, unknown>[] {
		return [
			...this.pipeline,
			{
				$facet: {
					total: [{ $count: 'count' }],
					data: this.buildOptionsPipeline(),
				},
			},
		];
	}

	private buildOptionsPipeline(): Record<string, unknown>[] {
		const optionsPipeline: Record<string, unknown>[] = [];
		const sortObject: SortOrderNumberType = Object.fromEntries(
			Object.entries(this.options?.order ?? {}).map(([key, value]) => [key, value === SortOrder.asc ? 1 : -1])
		);

		if (!('_id' in sortObject)) {
			sortObject._id = 1;
		}
		optionsPipeline.push({ $sort: sortObject });

		optionsPipeline.push({ $skip: this.options?.pagination?.skip || 0 });

		if (this.options?.pagination?.limit) {
			optionsPipeline.push({ $limit: this.options.pagination.limit });
		}

		return optionsPipeline;
	}
}
