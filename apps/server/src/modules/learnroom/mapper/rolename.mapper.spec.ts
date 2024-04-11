import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain/interface';
import { UserAndAccountTestFactory, courseFactory, roleFactory, setupEntities, userFactory } from '@shared/testing';
import { RoleNameMapper } from './rolename.mapper';

describe('rolename mapper', () => {
	let module: TestingModule;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			imports: [],
			providers: [],
		}).compile();
	});

	const setup = () => {
		const teacherUser = userFactory.asTeacher().buildWithId();
		const studentUser = userFactory.asStudent().buildWithId();
		const course = courseFactory.build({
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

		expect(() => RoleNameMapper.mapToRoleName(user, course)).toThrowError('Unsupported role');
	});
});
