import { MikroORM } from '@mikro-orm/core';
import { TestingModule, Test } from '@nestjs/testing';
import { roleFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { Role, School, User } from '../entity';
import { Actions } from './actions.enum';
import { UserRule } from './user.rule';

describe('UserRule', () => {
	let orm: MikroORM;
	let userRule: UserRule;
	let mockSchool: School;
	let mockUser: User;
	let mockUserWithMockSchool: User;
	let mockStudentUserWithMockSchool: User;
	let mockTeacherUserWithMockSchool: User;
	let mockAdminUserWithMockSchool: User;
	let mockSuperheroUser: User;

	beforeAll(async () => {
		orm = await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [UserRule],
		}).compile();

		userRule = await module.get(UserRule);
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(() => {
		mockSchool = schoolFactory.build();
		mockUser = userFactory.build();
		mockUserWithMockSchool = userFactory.build({ school: mockSchool });
		mockStudentUserWithMockSchool = userFactory.build({ school: mockSchool, roles: [new Role({ name: 'student' })] });
		mockTeacherUserWithMockSchool = userFactory.build({ school: mockSchool, roles: [new Role({ name: 'teacher' })] });
		mockAdminUserWithMockSchool = userFactory.build({
			school: mockSchool,
			roles: [new Role({ name: 'administrator' })],
		});
		mockSuperheroUser = userFactory.build({ roles: [new Role({ name: 'superhero' })] });
	});

	describe('hasPermission', () => {
		it('should return true for an user with the role superhero', () => {
			const permission = userRule.hasPermission(mockSuperheroUser, mockUser, Actions.read);

			expect(permission).toBe(true);
		});

		it('should return false, if user is not at the same school', () => {
			const permission = userRule.hasPermission(mockUserWithMockSchool, mockUser, Actions.read);

			expect(permission).toBe(false);
		});

		it('should return true, if current user has permission for target user with role student', () => {
			const role = roleFactory.build({ permissions: ['STUDENT_LIST', 'STUDENT_EDIT'] });
			const currentUser = userFactory.build({ school: mockSchool, roles: [role] });

			const readPermission = userRule.hasPermission(currentUser, mockStudentUserWithMockSchool, Actions.read);
			const writePermission = userRule.hasPermission(currentUser, mockStudentUserWithMockSchool, Actions.write);

			expect(readPermission).toBe(true);
			expect(writePermission).toBe(true);
		});

		it('should return true, if current user has permission for target user with role teacher', () => {
			const role = roleFactory.build({ permissions: ['TEACHER_LIST', 'TEACHER_EDIT'] });
			const currentUser = userFactory.build({ school: mockSchool, roles: [role] });

			const readPermission = userRule.hasPermission(currentUser, mockTeacherUserWithMockSchool, Actions.read);
			const writePermission = userRule.hasPermission(currentUser, mockTeacherUserWithMockSchool, Actions.write);

			expect(readPermission).toBe(true);
			expect(writePermission).toBe(true);
		});

		it('should return false, if current user has no permission for target user with role teacher', () => {
			const readPermission = userRule.hasPermission(
				mockUserWithMockSchool,
				mockTeacherUserWithMockSchool,
				Actions.read
			);
			const writePermission = userRule.hasPermission(
				mockUserWithMockSchool,
				mockTeacherUserWithMockSchool,
				Actions.write
			);

			expect(readPermission).toBe(false);
			expect(writePermission).toBe(false);
		});

		it('should return false, if current user has no permission for target user with role student', () => {
			const readPermission = userRule.hasPermission(
				mockUserWithMockSchool,
				mockStudentUserWithMockSchool,
				Actions.read
			);
			const writePermission = userRule.hasPermission(
				mockUserWithMockSchool,
				mockStudentUserWithMockSchool,
				Actions.write
			);

			expect(readPermission).toBe(false);
			expect(writePermission).toBe(false);
		});

		it('should return false, if action is unknown', () => {
			const permissionStudent = userRule.hasPermission(
				mockUserWithMockSchool,
				mockStudentUserWithMockSchool,
				Object.values(Actions).push('unknown')
			);

			const permissionTeacher = userRule.hasPermission(
				mockUserWithMockSchool,
				mockTeacherUserWithMockSchool,
				Object.values(Actions).push('unknown')
			);

			expect(permissionStudent).toBe(false);
			expect(permissionTeacher).toBe(false);
		});

		it('should return true, if current user has permission for target user with role admin', () => {
			const role = roleFactory.build({ permissions: ['ADMIN_EDIT'] });
			const currentUser = userFactory.build({ school: mockSchool, roles: [role] });

			const readPermission = userRule.hasPermission(currentUser, mockAdminUserWithMockSchool, Actions.read);
			const writePermission = userRule.hasPermission(currentUser, mockAdminUserWithMockSchool, Actions.write);

			expect(readPermission).toBe(true);
			expect(writePermission).toBe(true);
		});

		it('should return false, if current user has no permission for target user with role admin', () => {
			const readPermission = userRule.hasPermission(mockUserWithMockSchool, mockAdminUserWithMockSchool, Actions.read);
			const writePermission = userRule.hasPermission(
				mockUserWithMockSchool,
				mockAdminUserWithMockSchool,
				Actions.write
			);

			expect(readPermission).toBe(false);
			expect(writePermission).toBe(false);
		});

		it('should return false, if target user is neither student nor teacher', () => {
			const readPermission = userRule.hasPermission(mockAdminUserWithMockSchool, mockUserWithMockSchool, Actions.read);
			const writePermission = userRule.hasPermission(
				mockAdminUserWithMockSchool,
				mockUserWithMockSchool,
				Actions.write
			);

			expect(readPermission).toBe(false);
			expect(writePermission).toBe(false);
		});
	});
});
