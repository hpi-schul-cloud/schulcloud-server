import { UserDiscoverableQuery } from '../../domain';
import { UserScope } from './user.scope';

describe('UserScope', () => {
	let scope1: UserScope;

	beforeEach(() => {
		scope1 = new UserScope();
		scope1.allowEmptyQuery(true);
	});

	describe('isOutdated is called', () => {
		it('should return scope with added query where outdatedSince exists is true', () => {
			scope1.isOutdated(true);
			expect(scope1.query).toEqual({
				outdatedSince: {
					$exists: true,
				},
			});
		});

		it('should return scope with added query where outdatedSince exists is false', () => {
			scope1.isOutdated(false);
			expect(scope1.query).toEqual({
				outdatedSince: {
					$exists: false,
				},
			});
		});

		it('should return scope without added outdatedSince to query', () => {
			scope1.isOutdated(undefined);
			expect(scope1.query).toEqual({});
		});
	});

	describe('bySchool is called', () => {
		describe('when school parameter is undefined', () => {
			it('should return scope without added schoolId to query', () => {
				scope1.bySchoolId(undefined);
				expect(scope1.query).toEqual({});
			});
		});

		describe('when school parameter is defined', () => {
			it('should return scope with added schoolId to query', () => {
				const schoolId = 'schoolId';

				scope1.bySchoolId(schoolId);

				expect(scope1.query).toEqual({ school: schoolId });
			});
		});
	});

	describe('byRole is called', () => {
		describe('when role parameter is undefined', () => {
			it('should return scope without added role to query', () => {
				scope1.byRoleId(undefined);
				expect(scope1.query).toEqual({});
			});
		});

		describe('when role parameter is defined', () => {
			it('should return scope with added role to query', () => {
				const roleId = 'roleId';

				scope1.byRoleId(roleId);

				expect(scope1.query).toEqual({ roles: roleId });
			});
		});
	});

	describe('whereLastLoginSystemChangeSmallerThan is called', () => {
		it('should return scope with added query where loginSystemChangeSmallerThan is given', () => {
			const date: Date = new Date();
			scope1.whereLastLoginSystemChangeSmallerThan(date);

			expect(scope1.query).toEqual({
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
			scope1.whereLastLoginSystemChangeSmallerThan(undefined);
			expect(scope1.query).toEqual({});
		});
	});

	describe('whereOutdatedSinceEquals is called', () => {
		it('should return scope with added query where outdatedSinceEquals is given', () => {
			const date: Date = new Date();
			scope1.withOutdatedSince(date);

			expect(scope1.query).toEqual({
				outdatedSince: {
					$eq: date,
				},
			});
		});

		it('should return scope without added whereOutdatedSinceEquals to query', () => {
			scope1.whereLastLoginSystemChangeSmallerThan(undefined);
			expect(scope1.query).toEqual({});
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

			scope1.whereLastLoginSystemChangeIsBetween(startDate, endDate);

			expect(scope1.query).toEqual({
				lastLoginSystemChange: {
					$gte: startDate,
					$lt: endDate,
				},
			});
		});

		it('should return scope without added whereLastLoginSystemChangeIsBetween to query', () => {
			const { startDate } = setup();

			scope1.whereLastLoginSystemChangeIsBetween(startDate);

			expect(scope1.query).toEqual({});
		});
	});

	describe('byName', () => {
		describe('when name is undefined', () => {
			const setup = () => {
				const scope = new UserScope();
				const name = undefined;

				return { scope, name };
			};

			it('should use the default query', () => {
				const { scope, name } = setup();

				const result = scope.byName(name);

				expect(result.query).toEqual({
					$and: [{ id: false }],
				});
			});
		});

		describe('when name is valid', () => {
			const setup = () => {
				const scope = new UserScope();
				const name = 'John Doe';

				return { scope, name };
			};

			it('should add a query for firstName and lastName using regex', () => {
				const { scope, name } = setup();

				const result = scope.byName(name);
				const expectedRegex = new RegExp('John Doe', 'i');

				expect(result.query).toEqual({
					$or: [{ firstName: expectedRegex }, { lastName: expectedRegex }],
				});
			});
		});

		describe('when name contains invalid characters', () => {
			const setup = () => {
				const scope = new UserScope();
				const name = 'John$Doe';

				return { scope, name };
			};

			it('should remove this character', () => {
				const { scope, name } = setup();

				const result = scope.byName(name);
				const expectedRegex = new RegExp('JohnDoe', 'i');

				expect(result.query).toEqual({
					$or: [{ firstName: expectedRegex }, { lastName: expectedRegex }],
				});
			});
		});

		describe('when name exceeds maximum length', () => {
			const setup = () => {
				const scope = new UserScope();
				const name = 'A'.repeat(101); // Name with 101 characters

				return { scope, name };
			};

			it('should throw an error for exceeding maximum length', () => {
				const { scope, name } = setup();

				expect(() => scope.byName(name)).toThrowError('Seached value is too long');
			});
		});

		describe('when name contains leading or trailing spaces', () => {
			const setup = () => {
				const scope = new UserScope();
				const name = '   John Doe   ';

				return { scope, name };
			};

			it('should trim the name and add a query for firstName and lastName using regex', () => {
				const { scope, name } = setup();

				const result = scope.byName(name);
				const expectedRegex = new RegExp('John Doe', 'i');

				expect(result.query).toEqual({
					$or: [{ firstName: expectedRegex }, { lastName: expectedRegex }],
				});
			});
		});

		describe('when name contains a potential NoSQL injection', () => {
			const setup = () => {
				const scope = new UserScope();
				const name = '{"$ne": ""}'; //simulate NoSQL-Injection

				return { scope, name };
			};

			it('should throw an error for invalid search format', () => {
				const { scope, name } = setup();

				const result = scope.byName(name);
				const expectedRegex = new RegExp('ne', 'i');

				expect(result.query).toEqual({
					$or: [{ firstName: expectedRegex }, { lastName: expectedRegex }],
				});
			});
		});

		describe('when a user name contains one of the special characters "áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒß"', () => {
			const setup = () => {
				const scope = new UserScope();
				const name = 'A0_áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒß-B9';

				return { scope, name };
			};

			it('should not escape them', () => {
				const { scope, name } = setup();

				const result = scope.byName(name);
				const expectedRegex = new RegExp('A0_áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒß-B9', 'i');

				expect(result.query).toEqual({
					$or: [{ firstName: expectedRegex }, { lastName: expectedRegex }],
				});
			});
		});
	});

	describe('withDiscoverabilityTrue', () => {
		describe('when undefined', () => {
			it('should not add a query', () => {
				scope1.withDiscoverableTrue();

				expect(scope1.query).toEqual({});
			});
		});

		describe('when not false', () => {
			it('should add query to find true and undefined', () => {
				scope1.withDiscoverableTrue(UserDiscoverableQuery.NOT_FALSE);

				expect(scope1.query).toEqual({ discoverable: { $ne: false } });
			});
		});

		describe('when tue', () => {
			it('should add a query to find true', () => {
				scope1.withDiscoverableTrue(UserDiscoverableQuery.TRUE);

				expect(scope1.query).toEqual({ discoverable: true });
			});
		});
	});

	describe('withDeleted', () => {
		describe('when deleted users are included', () => {
			it('should not add a query', () => {
				scope1.withDeleted(true);

				expect(scope1.query).toEqual({});
			});
		});

		describe('when deleted users are excluded', () => {
			it('should add a query that removes deleted users', () => {
				scope1.withDeleted(false);

				expect(scope1.query).toEqual({
					$or: [{ deletedAt: { $exists: false } }, { deletedAt: null }, { deletedAt: { $gte: expect.any(Date) } }],
				});
			});
		});
	});
});
