import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, CourseGroup } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { courseFactory } from '@testing/factory/course.factory';
import { roleFactory } from '@testing/factory/role.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { RoleNameMapper } from './rolename.mapper';

describe('rolename mapper', () => {
	let module: TestingModule;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([User, Course, CourseGroup]);
		module = await Test.createTestingModule({
			imports: [],
			providers: [],
		}).compile();
	});

	const setup = () => {
		const teacherUser = userFactory.asTeacher().buildWithId();
		const studentUser = userFactory.asStudent().buildWithId();
		const course = courseFactory.buildWithId({
			teachers: [teacherUser],
			students: [studentUser],
		});

		return { teacherUser, studentUser, course };
	};
	it('should map teacher correctly', () => {
		const { teacherUser } = UserAndAccountTestFactory.buildTeacher({}, []);
		const course = courseFactory.build({
			teachers: [teacherUser],
		});
		const value = RoleNameMapper.mapToRoleName(teacherUser, course);
		expect(value).toBe(RoleName.TEACHER);
	});

	it('should map student correctly', () => {
		const { studentUser, course } = setup();
		const value = RoleNameMapper.mapToRoleName(studentUser, course);
		expect(value).toBe(RoleName.STUDENT);
	});

	it('throws with unsupported role', () => {
		const { course } = setup();
		const role = roleFactory.build({ name: RoleName.EXPERT });
		const user = userFactory.buildWithId({ roles: [role] });

		expect(() => RoleNameMapper.mapToRoleName(user, course)).toThrowError(
			`Unable to determine a valid role for user ${user.id} in course ${course.id}`
		);
	});
});
