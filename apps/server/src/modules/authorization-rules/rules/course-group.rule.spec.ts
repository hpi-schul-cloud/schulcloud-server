import {
	Action,
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory, courseGroupEntityFactory } from '@modules/course/testing';
import { roleFactory } from '@modules/role/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { CourseGroupRule } from './course-group.rule';
import { CourseRule } from './course.rule';

const createUserWithPermissions = () => {
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;
	const role = roleFactory.build({ permissions: [permissionA, permissionB] });
	const user = userFactory.build({ roles: [role] });

	return { user, permissionA, permissionB, permissionC };
};

describe('CourseGroupRule', () => {
	let service: CourseGroupRule;
	let authorizationHelper: AuthorizationHelper;
	let injectionService: AuthorizationInjectionService;
	let courseRule: CourseRule;
	let entity: CourseGroupEntity;

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationHelper,
				CourseRule,
				CourseGroupRule,
				AuthorizationInjectionService,
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		service = await module.get(CourseGroupRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		injectionService = await module.get(AuthorizationInjectionService);
		courseRule = await module.get(CourseRule);
	});

	describe('hasPermission', () => {
		const setup = () => {
			const { user } = createUserWithPermissions();
			const course = courseEntityFactory.build({ teachers: [user] });
			entity = courseGroupEntityFactory.build({ course });
			const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');

			return { user, spy };
		};

		it('should call hasAllPermissions on AuthorizationHelper', () => {
			const { user, spy } = setup();

			service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });

			expect(spy).toBeCalledWith(user, []);
		});
	});

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(service);
		});
	});

	describe('Action.read', () => {
		const setup = () => {
			const { user } = createUserWithPermissions();
			const course = courseEntityFactory.build({ teachers: [user] });
			entity = courseGroupEntityFactory.build({ course });
			const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');

			return { user, spy };
		};

		it('should call hasAccessToEntity on AuthorizationHelper', () => {
			const { user, spy } = setup();

			service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });

			expect(spy).toBeCalledWith(user, entity, ['students']);
		});

		describe('when calling courseRule', () => {
			const setup = () => {
				const { user } = createUserWithPermissions();
				const course = courseEntityFactory.build({ teachers: [user] });
				entity = courseGroupEntityFactory.build({ course });
				const spy = jest.spyOn(courseRule, 'hasPermission');

				return { user, spy };
			};

			it('should call courseRule.hasPermission', () => {
				const { user, spy } = setup();

				service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });

				expect(spy).toBeCalledWith(user, entity.course, { action: Action.write, requiredPermissions: [] });
			});
		});
	});

	describe('Action.write', () => {
		describe('when calling hasAccessToEntity', () => {
			const setup = () => {
				const { user } = createUserWithPermissions();
				const course = courseEntityFactory.build({ teachers: [user] });
				entity = courseGroupEntityFactory.build({ course });
				const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');

				return { user, spy };
			};

			it('should call hasAccessToEntity on AuthorizationHelper', () => {
				const { user, spy } = setup();

				service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [] });

				expect(spy).toBeCalledWith(user, entity, ['students']);
			});
		});

		describe('when calling courseRule', () => {
			const setup = () => {
				const { user } = createUserWithPermissions();
				const course = courseEntityFactory.build({ teachers: [user] });
				entity = courseGroupEntityFactory.build({ course });
				const spy = jest.spyOn(courseRule, 'hasPermission');

				return { user, spy };
			};

			it('should call courseRule.hasPermission', () => {
				const { user, spy } = setup();

				service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [] });

				expect(spy).toBeCalledWith(user, entity.course, { action: Action.write, requiredPermissions: [] });
			});
		});
	});

	describe('User [TEACHER]', () => {
		describe('with passed permissions', () => {
			const setup = () => {
				const { user } = createUserWithPermissions();
				const course = courseEntityFactory.build({ teachers: [user] });
				entity = courseGroupEntityFactory.build({ course, students: [] });

				return { user };
			};

			it('should return "true" if user in scope', () => {
				const { user } = setup();

				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		describe('without permission', () => {
			describe('when user has not permission', () => {
				const setup = () => {
					const { user, permissionC } = createUserWithPermissions();
					const course = courseEntityFactory.build({ teachers: [user] });
					entity = courseGroupEntityFactory.build({ course });

					return { user, permissionC };
				};

				it('should return "false" if user has not permission', () => {
					const { user, permissionC } = setup();

					const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionC] });

					expect(res).toBe(false);
				});
			});

			describe('when user has not access to entity', () => {
				const setup = () => {
					const { user, permissionA } = createUserWithPermissions();
					entity = courseGroupEntityFactory.build();

					return { user, permissionA };
				};

				it('should return "false" if user has not access to entity', () => {
					const { user, permissionA } = setup();

					const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionA] });

					expect(res).toBe(false);
				});
			});
		});
	});

	describe('User [STUDENT]', () => {
		describe('with passed permissions', () => {
			const setup = () => {
				const { user } = createUserWithPermissions();
				const course = courseEntityFactory.build({ students: [] });
				entity = courseGroupEntityFactory.build({ course, students: [user] });

				return { user };
			};

			it('should return "true" if user in scope', () => {
				const { user } = setup();

				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		describe('without permission', () => {
			describe('when user has not permission', () => {
				const setup = () => {
					const { user, permissionC } = createUserWithPermissions();
					const course = courseEntityFactory.build({ students: [] });
					entity = courseGroupEntityFactory.build({ course, students: [user] });

					return { user, permissionC };
				};

				it('should return "false" if user has not permission', () => {
					const { user, permissionC } = setup();

					const res = service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [permissionC] });

					expect(res).toBe(false);
				});
			});

			describe('when user has not access to entity', () => {
				const setup = () => {
					const { user, permissionA } = createUserWithPermissions();
					const course = courseEntityFactory.build({ students: [user] });
					entity = courseGroupEntityFactory.build({ course, students: [] });

					return { user, permissionA };
				};

				it('should return "false" if user has not access to entity', () => {
					const { user, permissionA } = setup();

					const res = service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [permissionA] });

					expect(res).toBe(false);
				});
			});
		});
	});

	describe('User with CAN_EXECUTE_INSTANCE_OPERATIONS permission', () => {
		describe('when user has instance operation permission', () => {
			const setup = () => {
				const role = roleFactory.build({ permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS] });
				const user = userFactory.build({ roles: [role] });
				const course = courseEntityFactory.build();
				entity = courseGroupEntityFactory.build({ course, students: [] });

				return { user };
			};

			it('should return "true" for read action even without being student or teacher', () => {
				const { user } = setup();

				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});

			it('should return "true" for write action even without being student or teacher', () => {
				const { user } = setup();

				const res = service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		describe('when user has instance operation permission but missing required permissions', () => {
			const setup = () => {
				const role = roleFactory.build({ permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS] });
				const user = userFactory.build({ roles: [role] });
				const course = courseEntityFactory.build();
				entity = courseGroupEntityFactory.build({ course, students: [] });
				const missingPermission = 'missing' as Permission;

				return { user, missingPermission };
			};

			it('should return "false" when required permissions are not met', () => {
				const { user, missingPermission } = setup();

				const res = service.hasPermission(user, entity, {
					action: Action.read,
					requiredPermissions: [missingPermission],
				});

				expect(res).toBe(false);
			});
		});
	});

	describe('when the action is not read or write', () => {
		const setup = () => {
			const { user } = createUserWithPermissions();
			const course = courseEntityFactory.build({ teachers: [user] });
			entity = courseGroupEntityFactory.build({ course });

			return { user };
		};

		it('should throw NotImplementedException', () => {
			const { user } = setup();

			expect(() =>
				service.hasPermission(user, entity, { action: 'unknown' as Action, requiredPermissions: [] })
			).toThrow(NotImplementedException);
		});
	});
});
