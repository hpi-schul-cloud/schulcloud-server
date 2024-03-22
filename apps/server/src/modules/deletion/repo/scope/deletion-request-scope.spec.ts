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

	describe('byStatus', () => {
		const setup = () => {
			const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
			const expectedQuery = {
				$or: [
					{ status: StatusModel.FAILED },
					{
						$and: [
							{ status: [StatusModel.REGISTERED, StatusModel.PENDING] },
							{ updatedAt: { $lt: fifteenMinutesAgo } },
						],
					},
				],
			};
			return {
				expectedQuery,
				fifteenMinutesAgo,
			};
		};
		describe('when fifteenMinutesAgo is set', () => {
			it('should add query', () => {
				const { expectedQuery, fifteenMinutesAgo } = setup();

				const result = scope.byStatus(fifteenMinutesAgo);

				expect(result).toBeInstanceOf(DeletionRequestScope);
				expect(scope.query).toEqual(expectedQuery);
			});
		});
	});
});
