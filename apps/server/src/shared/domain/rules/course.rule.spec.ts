import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, roleFactory, setupEntities, userFactory } from '@shared/testing';
import { Course, User } from '../entity';
import { Permission } from '../interface';
import { Actions } from './actions.enum';
import { AuthorizationHelper } from './authorization.helper';
import { CourseRule } from './course.rule';

describe('CourseRule', () => {
	let service: CourseRule;
	let authorizationHelper: AuthorizationHelper;
	let user: User;
	let entity: Course;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, CourseRule],
		}).compile();

		service = await module.get(CourseRule);
		authorizationHelper = await module.get(AuthorizationHelper);
	});

	beforeEach(() => {
		const role = roleFactory.build({ permissions: [permissionA, permissionB] });
		user = userFactory.build({ roles: [role] });
	});

	it('should call hasAllPermissions on AuthorizationHelper', () => {
		entity = courseFactory.build({ teachers: [user] });
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	it('should call hasAccessToEntity on AuthorizationHelper if action = "read"', () => {
		entity = courseFactory.build({ teachers: [user] });
		const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');
		service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, entity, ['teachers', 'substitutionTeachers', 'students']);
	});

	it('should call hasAccessToEntity on AuthorizationHelper if action = "write"', () => {
		entity = courseFactory.build({ teachers: [user] });
		const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');
		service.hasPermission(user, entity, { action: Actions.write, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, entity, ['teachers', 'substitutionTeachers']);
	});

	it('should return "true" if user in scope', () => {
		entity = courseFactory.build({ teachers: [user] });
		const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(res).toBe(true);
	});

	it('should return "false" if user has not permission', () => {
		entity = courseFactory.build({ teachers: [user] });
		const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionC] });
		expect(res).toBe(false);
	});

	it('should return "false" if user has not access to entity', () => {
		entity = courseFactory.build();
		const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionC] });
		expect(res).toBe(false);
	});
});
