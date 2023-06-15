import { UserScope } from './user.scope';

describe('UserScope', () => {
	let scope: UserScope;

	beforeEach(() => {
		scope = new UserScope();
		scope.allowEmptyQuery(true);
	});

	describe('isOutdated is called', () => {
		it('should return scope with added query where outdatedSince exists is true', () => {
			scope.isOutdated(true);
			expect(scope.query).toEqual({
				outdatedSince: {
					$exists: true,
				},
			});
		});

		it('should return scope with added query where outdatedSince exists is false', () => {
			scope.isOutdated(false);
			expect(scope.query).toEqual({
				outdatedSince: {
					$exists: false,
				},
			});
		});

		it('should return scope without added outdatedSince to query', () => {
			scope.isOutdated(undefined);
			expect(scope.query).toEqual({});
		});
	});

	describe('bySchool is called', () => {
		describe('when school parameter is undefined', () => {
			it('should return scope without added schoolId to query', () => {
				scope.bySchoolId(undefined);
				expect(scope.query).toEqual({});
			});
		});

		describe('when school parameter is defined', () => {
			it('should return scope with added schoolId to query', () => {
				const schoolId = 'schoolId';

				scope.bySchoolId(schoolId);

				expect(scope.query).toEqual({ school: schoolId });
			});
		});
	});

	describe('whereLastLoginSystemChangeSmallerThan is called', () => {
		it('should return scope with added query where loginSystemChangeSmallerThan is given', () => {
			const date: Date = new Date();
			scope.whereLastLoginSystemChangeSmallerThan(date);

			expect(scope.query).toEqual({
				$or: [
					{
						lastLoginSystemChange: {
							$lt: date,
						},
					},
					{
						lastLoginSystemChange: {
							$exists: false,
						},
					},
				],
			});
		});

		it('should return scope without added loginSystemChangeSmallerThan to query', () => {
			scope.whereLastLoginSystemChangeSmallerThan(undefined);
			expect(scope.query).toEqual({});
		});
	});

	describe('whereOutdatedSinceEquals is called', () => {
		it('should return scope with added query where outdatedSinceEquals is given', () => {
			const date: Date = new Date();
			scope.withOutdatedSince(date);

			expect(scope.query).toEqual({
				outdatedSince: {
					$eq: date,
				},
			});
		});

		it('should return scope without added whereOutdatedSinceEquals to query', () => {
			scope.whereLastLoginSystemChangeSmallerThan(undefined);
			expect(scope.query).toEqual({});
		});
	});

	describe('whereLastLoginSystemChangeIsBetween', () => {
		const setup = () => {
			const startDate: Date = new Date();
			const endDate: Date = new Date();

			return {
				startDate,
				endDate,
			};
		};

		it('should return scope with added query where lastLoginSystemChange gte and lt is given', () => {
			const { startDate, endDate } = setup();

			scope.whereLastLoginSystemChangeIsBetween(startDate, endDate);

			expect(scope.query).toEqual({
				lastLoginSystemChange: {
					$gte: startDate,
					$lt: endDate,
				},
			});
		});

		it('should return scope without added whereLastLoginSystemChangeIsBetween to query', () => {
			const { startDate } = setup();

			scope.whereLastLoginSystemChangeIsBetween(startDate, undefined);

			expect(scope.query).toEqual({});
		});
	});
});
