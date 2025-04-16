import { UserDiscoverableQuery } from '../../domain';
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

	describe('byRole is called', () => {
		describe('when role parameter is undefined', () => {
			it('should return scope without added role to query', () => {
				scope.byRoleId(undefined);
				expect(scope.query).toEqual({});
			});
		});

		describe('when role parameter is defined', () => {
			it('should return scope with added role to query', () => {
				const roleId = 'roleId';

				scope.byRoleId(roleId);

				expect(scope.query).toEqual({ roles: roleId });
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

			scope.whereLastLoginSystemChangeIsBetween(startDate);

			expect(scope.query).toEqual({});
		});
	});

	describe('byName', () => {
		describe('when a name is given', () => {
			const setup = () => {
				const name = 'test';

				return {
					name,
				};
			};

			it('should return scope with added query where firstname or lastname match the given string', () => {
				const { name } = setup();

				scope.byName('test');

				expect(scope.query).toEqual({
					$or: [{ firstName: new RegExp(name, 'i') }, { lastName: new RegExp(name, 'i') }],
				});
			});
		});

		describe('when no name is given', () => {
			it('should not add a query', () => {
				scope.byName();

				expect(scope.query).toEqual({});
			});
		});

		describe('when a name contains "ß"', () => {
			const setup = () => {
				const name = 'Beißner';

				return {
					name,
				};
			};

			it('should return scope with added query where first or lastname is given without removing the "ß"', () => {
				const { name } = setup();

				scope.byName(name);

				expect(scope.query).toEqual({
					$or: [{ firstName: new RegExp(name, 'i') }, { lastName: new RegExp(name, 'i') }],
				});
			});
		});
	});

	describe('withDiscoverabilityTrue', () => {
		describe('when undefined', () => {
			it('should not add a query', () => {
				scope.withDiscoverableTrue();

				expect(scope.query).toEqual({});
			});
		});

		describe('when not false', () => {
			it('should add query to find true and undefined', () => {
				scope.withDiscoverableTrue(UserDiscoverableQuery.NOT_FALSE);

				expect(scope.query).toEqual({ discoverable: { $ne: false } });
			});
		});

		describe('when tue', () => {
			it('should add a query to find true', () => {
				scope.withDiscoverableTrue(UserDiscoverableQuery.TRUE);

				expect(scope.query).toEqual({ discoverable: true });
			});
		});
	});

	describe('withDeleted', () => {
		describe('when deleted users are included', () => {
			it('should not add a query', () => {
				scope.withDeleted(true);

				expect(scope.query).toEqual({});
			});
		});

		describe('when deleted users are excluded', () => {
			it('should add a query that removes deleted users', () => {
				scope.withDeleted(false);

				expect(scope.query).toEqual({ $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] });
			});
		});
	});
});
