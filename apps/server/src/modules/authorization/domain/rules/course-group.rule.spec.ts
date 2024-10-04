import { Test, TestingModule } from '@nestjs/testing';
import { CourseGroup, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { courseFactory, courseGroupFactory, roleFactory, setupEntities, userFactory } from '@shared/testing';
import { CourseGroupRule } from './course-group.rule';
import { Action } from '../type';
import { AuthorizationHelper } from '../service/authorization.helper';
import { AuthorizationInjectionService, AuthorizationService } from '../service';
import { DeepMocked, createMock } from '@golevelup/ts-jest';

describe('CourseGroupRule', () => {
	let service: CourseGroupRule;
	let authorizationHelper: AuthorizationHelper;
	let injectionService: AuthorizationInjectionService;
	let authorizationService: DeepMocked<AuthorizationService>;
	let user: User;
	let entity: CourseGroup;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationHelper,
				CourseGroupRule,
				AuthorizationInjectionService,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		service = await module.get(CourseGroupRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		injectionService = await module.get(AuthorizationInjectionService);
		authorizationService = await module.get(AuthorizationService);
		const role = roleFactory.build({ permissions: [permissionA, permissionB] });
		user = userFactory.build({ roles: [role] });
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should call hasAllPermissions on AuthorizationHelper', () => {
		const course = courseFactory.build({ teachers: [user] });
		entity = courseGroupFactory.build({ course });
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(service);
		});
	});

	describe('Action.read', () => {
		it('should call hasAccessToEntity on AuthorizationHelper', () => {
			const course = courseFactory.build({ teachers: [user] });
			entity = courseGroupFactory.build({ course });
			const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');
			service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
			expect(spy).toBeCalledWith(user, entity, ['students']);
		});

		it('should call courseRule.hasPermission', () => {
			const course = courseFactory.build({ teachers: [user] });
			entity = courseGroupFactory.build({ course });
			service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
			expect(authorizationService.hasPermission).toBeCalledWith(user, entity.course, {
				action: Action.write,
				requiredPermissions: [],
			});
		});
	});

	describe('Action.write', () => {
		it('should call hasAccessToEntity on AuthorizationHelper', () => {
			const course = courseFactory.build({ teachers: [user] });
			entity = courseGroupFactory.build({ course });
			const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');
			service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [] });
			expect(spy).toBeCalledWith(user, entity, ['students']);
		});

		it('should call courseRule.hasPermission', () => {
			const course = courseFactory.build({ teachers: [user] });
			entity = courseGroupFactory.build({ course });
			service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
			expect(authorizationService.hasPermission).toBeCalledWith(user, entity.course, {
				action: Action.write,
				requiredPermissions: [],
			});
		});
	});

	describe('User [TEACHER]', () => {
		const setUserIsTeacherInCourse = () => authorizationService.hasPermission.mockReturnValue(true);
		const setUserNotTeacherInCourse = () => authorizationService.hasPermission.mockReturnValue(false);

		describe('with passed permissions', () => {
			it('should return "true" if user is teacher in course', () => {
				const course = courseFactory.build({ teachers: [user] });
				entity = courseGroupFactory.build({ course, students: [] });
				setUserIsTeacherInCourse();
				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});
		});

		describe('without permission', () => {
			it('should return "false" if user has not permission', () => {
				const course = courseFactory.build({ teachers: [user] });
				entity = courseGroupFactory.build({ course });
				setUserIsTeacherInCourse();
				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionC] });
				expect(res).toBe(false);
			});

			it('should return "false" if user is not in course', () => {
				entity = courseGroupFactory.build();
				setUserNotTeacherInCourse();
				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionA] });
				expect(res).toBe(false);
			});
		});
	});

	describe('User [STUDENT]', () => {
		const setUserNotTeacherInCourse = () => authorizationService.hasPermission.mockReturnValue(false);

		describe('with passed permissions', () => {
			it('should return "true" if user in scope', () => {
				const course = courseFactory.build({ students: [] });
				entity = courseGroupFactory.build({ course, students: [user] });
				setUserNotTeacherInCourse();
				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});
		});

		describe('without permission', () => {
			it('should return "false" if user has not permission', () => {
				const course = courseFactory.build({ students: [] });
				entity = courseGroupFactory.build({ course, students: [user] });
				setUserNotTeacherInCourse();
				const res = service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [permissionC] });
				expect(res).toBe(false);
			});

			it('should return "false" if user has not access to entity', () => {
				const course = courseFactory.build({ students: [user] });
				setUserNotTeacherInCourse();
				entity = courseGroupFactory.build({ course, students: [] });
				const res = service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [permissionA] });
				expect(res).toBe(false);
			});
		});
	});
});
