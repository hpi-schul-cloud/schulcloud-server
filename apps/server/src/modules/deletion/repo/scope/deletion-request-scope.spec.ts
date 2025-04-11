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
			const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
			const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

			const expectedQueryOlder = {
				status: {
					$in: [StatusModel.FAILED, StatusModel.PENDING],
				},
				$and: [
					{
						updatedAt: {
							$lt: fiveMinutesAgo,
						},
					},
				],
			};
			const expectedQueryNewer = {
				status: {
					$in: [StatusModel.FAILED, StatusModel.PENDING],
				},
				$and: [
					{
						updatedAt: {
							$gte: fifteenMinutesAgo,
						},
					},
				],
			};
			const expectedQueryOlderAndNewer = {
				status: {
					$in: [StatusModel.FAILED, StatusModel.PENDING],
				},
				$and: [
					{
						updatedAt: {
							$lt: fiveMinutesAgo,
						},
					},
					{
						updatedAt: {
							$gte: fifteenMinutesAgo,
						},
					},
				],
			};
			const expectedQueryNoDates = {
				status: {
					$in: [StatusModel.FAILED, StatusModel.PENDING],
				},
			};

			return {
				expectedQueryOlder,
				expectedQueryNewer,
				expectedQueryOlderAndNewer,
				expectedQueryNoDates,
				olderThan: fiveMinutesAgo,
				newerThan: fifteenMinutesAgo,
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
		describe('when olderThan and newerThan are set', () => {
			it('should add query', () => {
				const { expectedQueryOlderAndNewer, olderThan, newerThan } = setup();

				const result = scope.byStatusAndDate([StatusModel.FAILED, StatusModel.PENDING], olderThan, newerThan);

				expect(result).toBeInstanceOf(DeletionRequestScope);
				expect(scope.query).toEqual(expectedQueryOlderAndNewer);
			});
		});
		describe('when olderThan and newerThan are not set', () => {
			it('should add query', () => {
				const { expectedQueryNoDates } = setup();

				const result = scope.byStatusAndDate([StatusModel.FAILED, StatusModel.PENDING]);

				expect(result).toBeInstanceOf(DeletionRequestScope);
				expect(scope.query).toEqual(expectedQueryNoDates);
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

	describe('byUserIdsAndRegistered', () => {
		const setup = () => {
			const userIds = ['user1', 'user2'];
			const expectedQuery = {
				status: StatusModel.REGISTERED,
				$and: [{ targetRefId: { $in: userIds } }],
			};

			return {
				userIds,
				expectedQuery,
			};
		};

		describe('when userIds are set', () => {
			it('should add query', () => {
				const { userIds, expectedQuery } = setup();

				const result = scope.byUserIdsAndRegistered(userIds);

				expect(result).toBeInstanceOf(DeletionRequestScope);
				expect(scope.query).toEqual(expectedQuery);
			});
		});
	});

	describe('byUserIdsAndFailed', () => {
		const setup = () => {
			const userIds = ['user1', 'user2'];
			const expectedQuery = {
				status: StatusModel.FAILED,
				$and: [{ targetRefId: { $in: userIds } }],
			};

			return {
				userIds,
				expectedQuery,
			};
		};

		describe('when userIds are set', () => {
			it('should add query', () => {
				const { userIds, expectedQuery } = setup();

				const result = scope.byUserIdsAndFailed(userIds);

				expect(result).toBeInstanceOf(DeletionRequestScope);
				expect(scope.query).toEqual(expectedQuery);
			});
		});
	});

	describe('byUserIdsAndPending', () => {
		const setup = () => {
			const userIds = ['user1', 'user2'];
			const expectedQuery = {
				status: StatusModel.PENDING,
				$and: [{ targetRefId: { $in: userIds } }],
			};

			return {
				userIds,
				expectedQuery,
			};
		};

		describe('when userIds are set', () => {
			it('should add query', () => {
				const { userIds, expectedQuery } = setup();

				const result = scope.byUserIdsAndPending(userIds);

				expect(result).toBeInstanceOf(DeletionRequestScope);
				expect(scope.query).toEqual(expectedQuery);
			});
		});
	});

	describe('byUserIdsAndSuccess', () => {
		const setup = () => {
			const userIds = ['user1', 'user2'];
			const expectedQuery = {
				status: StatusModel.SUCCESS,
				$and: [{ targetRefId: { $in: userIds } }],
			};

			return {
				userIds,
				expectedQuery,
			};
		};

		describe('when userIds are set', () => {
			it('should add query', () => {
				const { userIds, expectedQuery } = setup();

				const result = scope.byUserIdsAndSuccess(userIds);

				expect(result).toBeInstanceOf(DeletionRequestScope);
				expect(scope.query).toEqual(expectedQuery);
			});
		});
	});
});
