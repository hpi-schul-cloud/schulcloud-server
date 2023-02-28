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

	describe('hasPreviousExternalId is called', () => {
		it('should return scope with added query where hasPreviousExternalId exists is true', () => {
			scope.hasPreviousExternalId(true);
			expect(scope.query).toEqual({
				previousExternalId: {
					$exists: true,
				},
			});
		});

		it('should return scope with added query where hasPreviousExternalId exists is false', () => {
			scope.hasPreviousExternalId(false);
			expect(scope.query).toEqual({
				previousExternalId: {
					$exists: false,
				},
			});
		});

		it('should return scope without added hasPreviousExternalId to query', () => {
			scope.hasPreviousExternalId(undefined);
			expect(scope.query).toEqual({});
		});
	});
});
