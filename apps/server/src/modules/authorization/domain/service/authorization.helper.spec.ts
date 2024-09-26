import { courseFactory } from '@modules/learnroom/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import {
	courseFactory as courseEntityFactory,
	roleFactory,
	setupEntities,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { AuthorizationHelper } from './authorization.helper';

describe('AuthorizationHelper', () => {
	// If we have a class with no dependencies, do we still wanna build a testing module? Or is it fine like this?
	const service = new AuthorizationHelper();
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('hasAllPermissions', () => {
		it('should return true when no permissions are given to be checked', () => {
			const user = userFactory.build();

			const result = service.hasAllPermissions(user, []);

			expect(result).toEqual(true);
		});

		it('should return true when user has all permissions', () => {
			const role = roleFactory.build({ permissions: [permissionA, permissionB] });
			const user = userFactory.build({ roles: [role] });

			const result = service.hasAllPermissions(user, [permissionA, permissionB]);

			expect(result).toEqual(true);
		});

		it('should return false when user does not have all permissions', () => {
			const role = roleFactory.build({ permissions: [permissionA] });
			const user = userFactory.build({ roles: [role] });

			const result = service.hasAllPermissions(user, [permissionA, permissionB]);

			expect(result).toEqual(false);
		});
	});

	describe('hasAllPermissionsByRole', () => {
		const setup = () => {
			const roleA = roleFactory.buildWithId({ permissions: [permissionA] });
			const roleB = roleFactory.buildWithId({ permissions: [permissionB], roles: [roleA] });
			const role = roleFactory.buildWithId({ permissions: [permissionC], roles: [roleB] });

			return { role };
		};

		it('should return true when no permissions are given to be checked', () => {
			const { role } = setup();

			const result = service.hasAllPermissionsByRole(role, []);

			expect(result).toEqual(true);
		});

		it('should return true when role has all permissions', () => {
			const { role } = setup();

			const result = service.hasAllPermissionsByRole(role, [permissionA, permissionB, permissionC]);

			expect(result).toEqual(true);
		});

		it('should return false when role does not have all permissions', () => {
			const { role } = setup();
			const permissionNotFound = 'notFound' as Permission;

			const result = service.hasAllPermissionsByRole(role, [permissionNotFound, permissionA]);

			expect(result).toEqual(false);
		});
	});

	describe('hasOneOfPermissions', () => {
		it('should return false when no permissions are given to be checked', () => {
			const user = userFactory.build();

			const result = service.hasOneOfPermissions(user, []);

			expect(result).toEqual(false);
		});

		it('should return false when no permissions (array) is given to be checked', () => {
			const user = userFactory.build();
			const result = service.hasOneOfPermissions(user, 'foo' as unknown as []);

			expect(result).toEqual(false);
		});

		it('should return true when user has at least one of the permissions', () => {
			const role = roleFactory.build({ permissions: [permissionA] });
			const user = userFactory.build({ roles: [role] });

			const result = service.hasOneOfPermissions(user, [permissionA, permissionB]);

			expect(result).toEqual(true);
		});

		it('should return false when user has none of the given permissions', () => {
			const role = roleFactory.build({ permissions: [permissionC] });
			const user = userFactory.build({ roles: [role] });

			const result = service.hasOneOfPermissions(user, [permissionA, permissionB]);

			expect(result).toEqual(false);
		});
	});

	describe('hasAccessToEntity', () => {
		describe('when only one prop is given and prop is instance of Collection', () => {
			it('should return true if user is contained in prop', () => {
				const user = userFactory.build();
				const course = courseEntityFactory.build({ students: [user] });

				const permissions = service.hasAccessToEntity(user, course, ['students']);

				expect(permissions).toEqual(true);
			});

			it('should return false if user is not contained in prop', () => {
				const user = userFactory.build();
				const course = courseEntityFactory.build({ students: [user] });

				const permissions = service.hasAccessToEntity(user, course, ['teachers']);

				expect(permissions).toEqual(false);
			});
		});

		describe('when when only one prop is given and prop is instance of User', () => {
			it('should return true if user is equal to user in prop', () => {
				const user = userFactory.build();
				const task = taskFactory.build({ creator: user });

				const permissions = service.hasAccessToEntity(user, task, ['creator']);

				expect(permissions).toEqual(true);
			});

			it('should return false if user is not equal user in prop', () => {
				const user = userFactory.build();
				const user2 = userFactory.build();
				const task = taskFactory.build({ creator: user2 });

				const permissions = service.hasAccessToEntity(user, task, ['creator']);

				expect(permissions).toEqual(false);
			});
		});

		describe('when only one prop is given and prop is an Array', () => {
			it('should return true if user is contained in prop', () => {
				const user = userFactory.build();
				const course = courseFactory.build({ studentIds: [user.id] });

				const permissions = service.hasAccessToEntity(user, course, ['students']);

				expect(permissions).toEqual(true);
			});

			it('should return false if user is not contained in prop', () => {
				const user = userFactory.build();
				const course = courseFactory.build({ studentIds: [user.id] });

				const permissions = service.hasAccessToEntity(user, course, ['teachers']);

				expect(permissions).toEqual(false);
			});
		});

		describe('when only one prop is given and prop is instance of ObjectId', () => {
			it('should return true if userId is equal to id in prop', () => {
				const user = userFactory.build();

				const permissions = service.hasAccessToEntity(user, user, ['id']);

				expect(permissions).toEqual(true);
			});

			it('should return false if userId is not equal to id in prop', () => {
				const user = userFactory.buildWithId();
				const user2 = userFactory.buildWithId();

				const permissions = service.hasAccessToEntity(user, user2, ['id']);

				expect(permissions).toEqual(false);
			});
		});

		describe('when several props are given', () => {
			it('should return true if the user is referenced in at least one prop', () => {
				const user = userFactory.build();
				const task = taskFactory.build({ creator: user });

				const permissions = service.hasAccessToEntity(user, task, ['creator']);

				expect(permissions).toEqual(true);
			});

			it('should return false if the user is referenced in none of the props', () => {
				const user = userFactory.build();
				const user2 = userFactory.build();
				const task = taskFactory.build({ creator: user });

				const permissions = service.hasAccessToEntity(user2, task, ['creator']);

				expect(permissions).toEqual(false);
			});
		});
	});

	describe('hasRole', () => {
		describe('when user has role', () => {
			const setup = () => {
				const user = userFactory.asTeacher().buildWithId();

				return { user };
			};

			it('should return true', () => {
				const { user } = setup();

				const result = service.hasRole(user, RoleName.TEACHER);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have role', () => {
			const setup = () => {
				const user = userFactory.asStudent().buildWithId();

				return { user };
			};

			it('should return false', () => {
				const { user } = setup();

				const result = service.hasRole(user, RoleName.TEACHER);

				expect(result).toBe(false);
			});
		});
	});
});
