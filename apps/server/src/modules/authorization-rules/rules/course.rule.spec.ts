import {
	Action,
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory, courseFactory } from '@modules/course/testing';
import { roleFactory } from '@modules/role/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { CourseRule } from './course.rule';

const createUserWithPermissions = () => {
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;
	const role = roleFactory.build({ permissions: [permissionA, permissionB] });
	const user = userFactory.build({ roles: [role] });

	return { user, permissionA, permissionB, permissionC };
};

describe('CourseRule', () => {
	let module: TestingModule;
	let service: CourseRule;
	let authorizationHelper: AuthorizationHelper;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity]);

		module = await Test.createTestingModule({
			providers: [
				AuthorizationHelper,
				CourseRule,
				AuthorizationInjectionService,
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		service = await module.get(CourseRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(service);
		});
	});

	describe('when validating an entity', () => {
		describe('when calling hasAllPermissions', () => {
			const setup = () => {
				const { user } = createUserWithPermissions();
				const course = courseEntityFactory.build({ teachers: [user] });
				const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');

				return { user, course, spy };
			};

			it('should call hasAllPermissions on AuthorizationHelper', () => {
				const { user, course, spy } = setup();

				service.hasPermission(user, course, { action: Action.read, requiredPermissions: [] });

				expect(spy).toHaveBeenCalledWith(user, []);
			});
		});

		describe('when action is read', () => {
			const setup = () => {
				const { user } = createUserWithPermissions();
				const course = courseEntityFactory.build({ teachers: [user] });
				const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');

				return { user, course, spy };
			};

			it('should call hasAccessToEntity on AuthorizationHelper', () => {
				const { user, course, spy } = setup();

				service.hasPermission(user, course, { action: Action.read, requiredPermissions: [] });

				expect(spy).toBeCalledWith(user, course, ['teachers', 'substitutionTeachers', 'students']);
			});
		});

		describe('when action is write', () => {
			const setup = () => {
				const { user } = createUserWithPermissions();
				const course = courseEntityFactory.build({ teachers: [user] });
				const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');

				return { user, course, spy };
			};

			it('should call hasAccessToEntity on AuthorizationHelper', () => {
				const { user, course, spy } = setup();

				service.hasPermission(user, course, { action: Action.write, requiredPermissions: [] });

				expect(spy).toBeCalledWith(user, course, ['teachers', 'substitutionTeachers']);
			});
		});

		describe('when user is in scope', () => {
			const setup = () => {
				const { user } = createUserWithPermissions();
				const course = courseEntityFactory.build({ teachers: [user] });

				return { user, course };
			};

			it('should return "true"', () => {
				const { user, course } = setup();

				const res = service.hasPermission(user, course, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		describe('when user has not permission', () => {
			const setup = () => {
				const { user, permissionC } = createUserWithPermissions();
				const course = courseEntityFactory.build({ teachers: [user] });

				return { user, course, permissionC };
			};

			it('should return "false"', () => {
				const { user, course, permissionC } = setup();

				const res = service.hasPermission(user, course, { action: Action.read, requiredPermissions: [permissionC] });

				expect(res).toBe(false);
			});
		});

		describe('when user has not access to entity', () => {
			const setup = () => {
				const { user, permissionC } = createUserWithPermissions();
				const course = courseEntityFactory.build();

				return { user, course, permissionC };
			};

			it('should return "false"', () => {
				const { user, course, permissionC } = setup();

				const res = service.hasPermission(user, course, { action: Action.read, requiredPermissions: [permissionC] });

				expect(res).toBe(false);
			});
		});
	});

	describe('when validating an entity and the user has COURSE_ADMINISTRATION permission', () => {
		describe('when calling hasAllPermissions', () => {
			const setup = () => {
				const permissionD = Permission.COURSE_ADMINISTRATION;
				const adminRole = roleFactory.build({ permissions: [permissionD] });
				const adminUser = userFactory.build({ roles: [adminRole] });
				const course = courseEntityFactory.build();
				const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');

				return { adminUser, course, permissionD, spy };
			};

			it('should call hasAllPermissions with admin permissions on AuthorizationHelper', () => {
				const { permissionD, adminUser, course, spy } = setup();

				service.hasPermission(adminUser, course, { action: Action.read, requiredPermissions: [] });

				expect(spy).toHaveBeenNthCalledWith(2, adminUser, [permissionD]);
			});
		});

		describe('when calling hasAccessToEntity', () => {
			const setup = () => {
				const adminRole = roleFactory.build({ permissions: [Permission.COURSE_ADMINISTRATION] });
				const adminUser = userFactory.build({ roles: [adminRole] });
				const course = courseEntityFactory.build();
				const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');

				return { adminUser, course, spy };
			};

			it('should call hasAccessToEntity on AuthorizationHelper', () => {
				const { adminUser, course, spy } = setup();

				service.hasPermission(adminUser, course, { action: Action.read, requiredPermissions: [] });

				expect(spy).toHaveBeenNthCalledWith(1, adminUser, course, ['teachers', 'substitutionTeachers', 'students']);
			});
		});
	});

	describe('when user has CAN_EXECUTE_INSTANCE_OPERATIONS permission', () => {
		describe('when user has instance operation permission with COURSE_VIEW for read action', () => {
			const setup = () => {
				const role = roleFactory.build({
					permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS, Permission.COURSE_VIEW],
				});
				const instanceUser = userFactory.build({ roles: [role] });
				const course = courseEntityFactory.build();

				return { instanceUser, course };
			};

			it('should return "true" for read action even without being student or teacher', () => {
				const { instanceUser, course } = setup();

				const res = service.hasPermission(instanceUser, course, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		describe('when user has instance operation permission with COURSE_EDIT for write action', () => {
			const setup = () => {
				const role = roleFactory.build({
					permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS, Permission.COURSE_EDIT],
				});
				const instanceUser = userFactory.build({ roles: [role] });
				const course = courseEntityFactory.build();

				return { instanceUser, course };
			};

			it('should return "true" for write action even without being student or teacher', () => {
				const { instanceUser, course } = setup();

				const res = service.hasPermission(instanceUser, course, { action: Action.write, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		describe('when user has instance operation permission but missing required permissions', () => {
			const setup = () => {
				const role = roleFactory.build({
					permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS, Permission.COURSE_VIEW],
				});
				const instanceUser = userFactory.build({ roles: [role] });
				const course = courseEntityFactory.build();
				const missingPermission = 'missing' as Permission;

				return { instanceUser, course, missingPermission };
			};

			it('should return "false" when required permissions are not met', () => {
				const { instanceUser, course, missingPermission } = setup();

				const res = service.hasPermission(instanceUser, course, {
					action: Action.read,
					requiredPermissions: [missingPermission],
				});

				expect(res).toBe(false);
			});
		});

		describe('when user has only CAN_EXECUTE_INSTANCE_OPERATIONS without COURSE_VIEW', () => {
			const setup = () => {
				const role = roleFactory.build({
					permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS],
				});
				const instanceUser = userFactory.build({ roles: [role] });
				const course = courseEntityFactory.build();

				return { instanceUser, course };
			};

			it('should return "false" for read action', () => {
				const { instanceUser, course } = setup();

				const res = service.hasPermission(instanceUser, course, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(false);
			});
		});

		describe('when user has only CAN_EXECUTE_INSTANCE_OPERATIONS without COURSE_EDIT', () => {
			const setup = () => {
				const role = roleFactory.build({
					permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS],
				});
				const instanceUser = userFactory.build({ roles: [role] });
				const course = courseEntityFactory.build();

				return { instanceUser, course };
			};

			it('should return "false" for write action', () => {
				const { instanceUser, course } = setup();

				const res = service.hasPermission(instanceUser, course, { action: Action.write, requiredPermissions: [] });

				expect(res).toBe(false);
			});
		});
	});

	describe('when validating a domain object', () => {
		describe('when the user is authorized', () => {
			const setup = () => {
				const { user, permissionA } = createUserWithPermissions();
				const course = courseFactory.build({ teacherIds: [user.id] });

				return { user, course, permissionA };
			};

			it('should return true', () => {
				const { user, course, permissionA } = setup();

				const result: boolean = service.hasPermission(user, course, {
					action: Action.read,
					requiredPermissions: [permissionA],
				});

				expect(result).toEqual(true);
			});
		});

		describe('when the user is not authorized', () => {
			const setup = () => {
				const { user, permissionA } = createUserWithPermissions();
				const course = courseFactory.build({ studentIds: [user.id] });

				return { user, course, permissionA };
			};

			it('should return false', () => {
				const { user, course, permissionA } = setup();

				const result: boolean = service.hasPermission(user, course, {
					action: Action.write,
					requiredPermissions: [permissionA],
				});

				expect(result).toEqual(false);
			});
		});
	});
});
