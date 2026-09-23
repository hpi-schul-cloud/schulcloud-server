import { type IFindOptions, SortOrder } from '../domain/interface';
import { MongoDbScope } from './mongodb-scope';

describe(MongoDbScope.name, () => {
	class TestScope extends MongoDbScope<unknown> {}

	describe('build', () => {
		describe('when no options are given', () => {
			it('should return the default facet query', () => {
				const result = new TestScope().build();

				expect(result).toEqual([
					{
						$facet: {
							total: [{ $count: 'count' }],
							data: [{ $sort: { _id: 1 } }, { $skip: 0 }],
						},
					},
				]);
			});
		});

		describe('when options are given', () => {
			it('should return the facet query with pagination and order', () => {
				const options: IFindOptions<unknown> = {
					pagination: {
						skip: 12,
						limit: 50,
					},
					order: {
						name: SortOrder.asc,
						tree: SortOrder.desc,
					},
				};

				const result = new TestScope(options).build();

				expect(result).toEqual([
					{
						$facet: {
							total: [{ $count: 'count' }],
							data: [{ $sort: { name: 1, tree: -1, _id: 1 } }, { $skip: 12 }, { $limit: 50 }],
						},
					},
				]);
			});
		});
	});

	describe('buildDataPipeline', () => {
		it('should append stable sorting and pagination without mutating the scope', () => {
			const scope = new TestScope({ pagination: { skip: 12, limit: 50 } });

			const firstResult = scope.buildDataPipeline();
			const secondResult = scope.buildDataPipeline();

			expect(firstResult).toEqual([{ $sort: { _id: 1 } }, { $skip: 12 }, { $limit: 50 }]);
			expect(secondResult).toEqual(firstResult);
		});
	});

	describe('buildCountPipeline', () => {
		it('should append only the count stage', () => {
			const result = new TestScope({ pagination: { skip: 12, limit: 50 } }).buildCountPipeline();

			expect(result).toEqual([{ $count: 'count' }]);
		});
	});
});
