import { StatusModel } from '../../domain/types';
import { DeletionRequestScope } from './deletion-request-scope';

describe(DeletionRequestScope.name, () => {
	let scope: DeletionRequestScope;

	beforeEach(() => {
		scope = new DeletionRequestScope();
		scope.allowEmptyQuery(true);
	});

	describe('byDeleteAfter', () => {
		const setup = () => {
			const currentDate = new Date();
			const expectedQuery = { deleteAfter: { $lt: currentDate } };

			return {
				currentDate,
				expectedQuery,
			};
		};

		describe('when currentDate is set', () => {
			it('should add query', () => {
				const { currentDate, expectedQuery } = setup();

				const result = scope.byDeleteAfter(currentDate);

				expect(result).toBeInstanceOf(DeletionRequestScope);
				expect(scope.query).toEqual(expectedQuery);
			});
		});
	});

	describe('byStatusAndDate', () => {
		const setup = () => {
			const newerThan = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
			const olderThan = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

			const expectedQueryOlder = {
				status: {
					$in: [StatusModel.FAILED, StatusModel.PENDING],
				},
				updatedAt: {
					$lt: olderThan,
				},
			};
			const expectedQueryNewer = {
				status: {
					$in: [StatusModel.FAILED, StatusModel.PENDING],
				},
				updatedAt: {
					$gte: newerThan,
				},
			};
			return {
				expectedQueryOlder,
				expectedQueryNewer,
				olderThan,
				newerThan,
			};
		};
		describe('when olderThan is set', () => {
			it('should add query', () => {
				const { expectedQueryOlder, olderThan } = setup();

				const result = scope.byStatusAndDate([StatusModel.FAILED, StatusModel.PENDING], olderThan);

				expect(result).toBeInstanceOf(DeletionRequestScope);
				expect(scope.query).toEqual(expectedQueryOlder);
			});
		});
		describe('when newerThan is set', () => {
			it('should add query', () => {
				const { expectedQueryNewer, newerThan } = setup();

				const result = scope.byStatusAndDate([StatusModel.FAILED, StatusModel.PENDING], undefined, newerThan);

				expect(result).toBeInstanceOf(DeletionRequestScope);
				expect(scope.query).toEqual(expectedQueryNewer);
			});
		});
	});

	describe('byStatusAndDate for Pending', () => {
		const setup = () => {
			const expectedQuery = { status: { $in: [StatusModel.PENDING] } };

			return { expectedQuery };
		};

		describe('when is called', () => {
			it('should add query', () => {
				const { expectedQuery } = setup();

				const result = scope.byStatusAndDate([StatusModel.PENDING]);

				expect(result).toBeInstanceOf(DeletionRequestScope);
				expect(scope.query).toEqual(expectedQuery);
			});
		});
	});
});
