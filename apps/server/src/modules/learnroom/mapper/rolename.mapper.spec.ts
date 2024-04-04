import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain/interface';
import { UserAndAccountTestFactory, courseFactory, setupEntities } from '@shared/testing';
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
		const { teacherUser } = UserAndAccountTestFactory.buildTeacher({}, []);
		const course = courseFactory.build({
			teachers: [teacherUser],
		});

		return { teacherUser, course };
	};
	it('should map teacher correctly', () => {
		const { teacherUser, course } = setup();
		const value = RoleNameMapper.mapToRoleName(teacherUser, course);
		expect(value).toBe(RoleName.TEACHER);
	});
});
