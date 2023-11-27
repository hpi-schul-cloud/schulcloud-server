import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication, StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain';
import { cleanupCollections, courseFactory, UserAndAccountTestFactory, TestApiClient } from '@shared/testing';
import { CourseMetadataListResponse } from '@modules/learnroom/controller/dto';
import { ServerTestModule } from '@modules/server/server.module';

const createStudent = () => {
	const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({}, [Permission.COURSE_VIEW]);
	return { account: studentAccount, user: studentUser };
};
const createTeacher = () => {
	const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [
		Permission.COURSE_VIEW,
		Permission.COURSE_EDIT,
	]);
	return { account: teacherAccount, user: teacherUser };
};

describe('Course Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, 'courses');
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
	});

	describe('[GET] /courses/', () => {
		const setup = () => {
			const student = createStudent();
			const teacher = createTeacher();
			const course = courseFactory.buildWithId({
				name: 'course #1',
				teachers: [teacher.user],
				students: [student.user],
			});

			return { student, course, teacher };
		};
		it('should find courses as student', async () => {
			const { student, course } = setup();
			await em.persistAndFlush([student.account, student.user, course]);
			em.clear();

			const loggedInClient = await testApiClient.login(student.account);
			const response = await loggedInClient.get();

			const { data } = response.body as CourseMetadataListResponse;
			expect(response.statusCode).toBe(200);
			expect(typeof data[0].title).toBe('string');
			expect(data[0].startDate).toBe(course.startDate);
			expect(data[0].untilDate).toBe(course.untilDate);
		});
		it('should find courses as teacher', async () => {
			const { teacher, course } = setup();
			await em.persistAndFlush([teacher.account, teacher.user, course]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacher.account);
			const response = await loggedInClient.get();

			const { data } = response.body as CourseMetadataListResponse;
			expect(response.statusCode).toBe(200);
			expect(typeof data[0].title).toBe('string');
			expect(data[0].startDate).toBe(course.startDate);
			expect(data[0].untilDate).toBe(course.untilDate);
		});
	});

	describe('[GET] /courses/:id/export', () => {
		const setup = () => {
			const student1 = createStudent();
			const student2 = createStudent();
			const teacher = createTeacher();
			const substitutionTeacher = createTeacher();
			const teacherUnkownToCourse = createTeacher();
			const course = courseFactory.build({
				name: 'course #1',
				teachers: [teacher.user],
				students: [student1.user, student2.user],
			});

			return { course, teacher, teacherUnkownToCourse, substitutionTeacher, student1 };
		};
		it('should find course export', async () => {
			const { teacher, course } = setup();
			await em.persistAndFlush([teacher.account, teacher.user, course]);
			em.clear();
			const version = { version: '1.1.0' };

			const loggedInClient = await testApiClient.login(teacher.account);
			const response = await loggedInClient.get(`${course.id}/export`).query(version);

			expect(response.statusCode).toEqual(200);
			const file = response.body as StreamableFile;
			expect(file).toBeDefined();
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			expect(response.header['content-type']).toBe('application/zip');
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			expect(response.header['content-disposition']).toBe('attachment;');
		});
	});
});
