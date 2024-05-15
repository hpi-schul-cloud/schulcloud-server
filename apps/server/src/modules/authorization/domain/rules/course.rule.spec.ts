import { courseFactory } from '@modules/learnroom/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { courseFactory as courseEntityFactory, roleFactory, setupEntities, userFactory } from '@shared/testing/factory';
import { AuthorizationHelper } from '../service/authorization.helper';
import { Action } from '../type';
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

	describe('when validating an entity', () => {
		it('should call hasAllPermissions on AuthorizationHelper', () => {
			entity = courseEntityFactory.build({ teachers: [user] });
			const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
			service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
			expect(spy).toBeCalledWith(user, []);
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
