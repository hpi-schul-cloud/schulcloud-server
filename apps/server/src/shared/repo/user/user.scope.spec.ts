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

	describe('whereLastLoginSystemChangeGreaterThan is called', () => {
		it('should return scope with added query where loginSystemChangeGreaterThan is given', () => {
			const date: Date = new Date();
			scope.whereLastLoginSystemChangeGreaterThan(date);

			expect(scope.query).toEqual({
				lastLoginSystemChange: {
					$gte: date,
				},
			});
		});

		it('should return scope without added loginSystemChangeGreaterThan to query', () => {
			scope.whereLastLoginSystemChangeGreaterThan(undefined);
			expect(scope.query).toEqual({});
		});
	});

	describe('whereOutdatedSinceEquals is called', () => {
		it('should return scope with added query where outdatedSinceEquals is given', () => {
			const date: Date = new Date();
			scope.whereOutdatedSinceEquals(date);

			expect(scope.query).toEqual({
				outdatedSince: {
					$eq: date,
				},
			});
		});

		it('should return scope without added whereOutdatedSinceEquals to query', () => {
			scope.whereLastLoginSystemChangeGreaterThan(undefined);
			expect(scope.query).toEqual({});
		});
	});
});
