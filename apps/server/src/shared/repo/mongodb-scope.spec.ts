import { IFindOptions, SortOrder } from '../domain/interface';
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
							data: [{ $skip: 0 }],
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
							data: [{ $sort: { name: 1, tree: -1 } }, { $skip: 12 }, { $limit: 50 }],
						},
					},
				]);
			});
		});
	});
});
