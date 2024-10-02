import { courseFactory } from '@modules/learnroom/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { courseFactory as courseEntityFactory, roleFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationHelper } from '../service/authorization.helper';
import { Action } from '../type';
import { CourseRule } from './course.rule';

describe('CourseRule', () => {
	let module: TestingModule;
	let service: CourseRule;
	let authorizationHelper: AuthorizationHelper;
	let user: User;
	let entity: Course;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [AuthorizationHelper, CourseRule],
		}).compile();

		service = await module.get(CourseRule);
		authorizationHelper = await module.get(AuthorizationHelper);
	});

	beforeEach(() => {
		const role = roleFactory.build({ permissions: [permissionA, permissionB] });
		user = userFactory.build({ roles: [role] });
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when validating an entity', () => {
		it('should call hasAllPermissions on AuthorizationHelper', () => {
			entity = courseEntityFactory.build({ teachers: [user] });
			const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
			service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
			expect(spy).toHaveBeenCalledWith(user, []);
		});

		it('should call hasAccessToEntity on AuthorizationHelper if action = "read"', () => {
			entity = courseEntityFactory.build({ teachers: [user] });
			const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');
			service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
			expect(spy).toBeCalledWith(user, entity, ['teachers', 'substitutionTeachers', 'students']);
		});

		it('should call hasAccessToEntity on AuthorizationHelper if action = "write"', () => {
			entity = courseEntityFactory.build({ teachers: [user] });
			const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');
			service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [] });
			expect(spy).toBeCalledWith(user, entity, ['teachers', 'substitutionTeachers']);
		});

		it('should return "true" if user in scope', () => {
			entity = courseEntityFactory.build({ teachers: [user] });
			const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "false" if user has not permission', () => {
			entity = courseEntityFactory.build({ teachers: [user] });
			const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});

		it('should return "false" if user has not access to entity', () => {
			entity = courseEntityFactory.build();
			const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});
	});

	describe('when validating an entity and the user has COURSE_ADMINISTRATION permission', () => {
		const setup = () => {
			const permissionD = Permission.COURSE_ADMINISTRATION;
			const adminRole = roleFactory.build({ permissions: [permissionD] });
			const adminUser = userFactory.build({ roles: [adminRole] });

			return {
				adminUser,
				permissionD,
			};
		};

		it('should call hasAllPermissions with admin permissions on AuthorizationHelper', () => {
			const { permissionD, adminUser } = setup();
			entity = courseEntityFactory.build();
			const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
			service.hasPermission(adminUser, entity, { action: Action.read, requiredPermissions: [] });
			expect(spy).toHaveBeenNthCalledWith(2, adminUser, [permissionD]);
		});

		it('should not call hasAccessToEntity on AuthorizationHelper', () => {
			const { adminUser } = setup();
			entity = courseEntityFactory.build();
			const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');
			service.hasPermission(adminUser, entity, { action: Action.read, requiredPermissions: [] });
			expect(spy).toHaveBeenCalledTimes(0);
		});
	});

	describe('when validating a domain object', () => {
		describe('when the user is authorized', () => {
			const setup = () => {
				const course = courseFactory.build({ teacherIds: [user.id] });

				return {
					course,
				};
			};

			it('should return true', () => {
				const { course } = setup();

				const result: boolean = service.hasPermission(user, course, {
					action: Action.read,
					requiredPermissions: [permissionA],
				});

				expect(result).toEqual(true);
			});
		});

		describe('when the user is not authorized', () => {
			const setup = () => {
				const course = courseFactory.build({ studentIds: [user.id] });

				return {
					course,
				};
			};

			it('should return false', () => {
				const { course } = setup();

				const result: boolean = service.hasPermission(user, course, {
					action: Action.write,
					requiredPermissions: [permissionA],
				});

				expect(result).toEqual(false);
			});
		});
	});
});
