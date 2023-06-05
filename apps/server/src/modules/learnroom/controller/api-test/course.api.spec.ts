import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain';
import { cleanupCollections, courseFactory, UserAndAccountTestFactory, TestApiClient } from '@shared/testing';
import { CourseMetadataListResponse, CourseResponse } from '@src/modules/learnroom/controller/dto';
import { ServerTestModule } from '@src/modules/server/server.module';

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

	describe('[GET] /courses/:id', () => {
		const setup = () => {
			const student1 = createStudent();
			const student2 = createStudent();
			const teacher = createTeacher();
			const substitutionTeacher = createTeacher();
			const teacherUnkownToCourse = createTeacher();
			const course = courseFactory.build({
				name: 'course #1',
				teachers: [teacher.user],
				substitutionTeachers: [substitutionTeacher.user],
				students: [student1.user, student2.user],
			});
			const courseWithoutStartAndUntilDate = courseFactory.build({
				name: 'course #2',
				teachers: [teacher.user],
				substitutionTeachers: [substitutionTeacher.user],
				students: [student1.user, student2.user],
				startDate: undefined,
				untilDate: undefined,
			});

			return { course, teacher, teacherUnkownToCourse, substitutionTeacher, student1, courseWithoutStartAndUntilDate };
		};
		it('should find course as teacher', async () => {
			const { course, teacher } = setup();
			await em.persistAndFlush([teacher.user, teacher.account, course]);

			em.clear();

			const loggedInClient = await testApiClient.login(teacher.account);
			const response = await loggedInClient.get(`${course.id}`);
			const courseResponse = response.body as CourseResponse;

			expect(response.statusCode).toEqual(200);
			expect(courseResponse).toBeDefined();
			expect(courseResponse.id).toEqual(course.id);
			expect(courseResponse.students?.length).toEqual(2);
			expect(courseResponse.startDate).toEqual(course.startDate);
		});
		it('should find course as substitution teacher', async () => {
			const { course, substitutionTeacher } = setup();
			await em.persistAndFlush([substitutionTeacher.user, substitutionTeacher.account, course]);

			em.clear();

			const loggedInClient = await testApiClient.login(substitutionTeacher.account);
			const response = await loggedInClient.get(`${course.id}`);
			const courseResponse = response.body as CourseResponse;

			expect(response.statusCode).toEqual(200);
			expect(courseResponse).toBeDefined();
			expect(courseResponse.id).toEqual(course.id);
			expect(courseResponse.students?.length).toEqual(2);
			expect(courseResponse.startDate).toEqual(course.startDate);
		});
		it('should not find course if the teacher is not assigned to', async () => {
			const { teacherUnkownToCourse, course } = setup();

			await em.persistAndFlush([course, teacherUnkownToCourse.account, teacherUnkownToCourse.user]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherUnkownToCourse.account);
			const response = await loggedInClient.get(`${course.id}`);
			expect(response.statusCode).toEqual(404);
		});
		it('should not find course if id does not exist', async () => {
			const { teacher, course } = setup();
			const unknownId = new ObjectId().toHexString();

			await em.persistAndFlush([course, teacher.account, teacher.user]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacher.account);
			const response = await loggedInClient.get(`${unknownId}`);
			expect(response.statusCode).toEqual(404);
		});
		it('should find course without start and until date', async () => {
			const { courseWithoutStartAndUntilDate, teacher } = setup();

			await em.persistAndFlush([courseWithoutStartAndUntilDate, teacher.account, teacher.user]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacher.account);
			const response = await loggedInClient.get(`${courseWithoutStartAndUntilDate.id}`);
			const courseResponse = response.body as CourseResponse;

			expect(response.statusCode).toEqual(200);
			expect(courseResponse).toBeDefined();
			expect(courseResponse.id).toEqual(courseWithoutStartAndUntilDate.id);
			expect(courseResponse.students?.length).toEqual(2);
			expect(courseResponse.startDate).toBeUndefined();
			expect(courseResponse.untilDate).toBeUndefined();
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
				students: [student1.user, student2.user],
			});

			return { course, teacher, teacherUnkownToCourse, substitutionTeacher, student1 };
		};
		it('should find course export', async () => {
			if (!Configuration.get('FEATURE_IMSCC_COURSE_EXPORT_ENABLED')) return;
			const { student1, course } = setup();

			await em.persistAndFlush(course);
			em.clear();

			const loggedInClient = await testApiClient.login(student1.account);
			const response = await loggedInClient.get(`${course.id}/export`);

			expect(response.statusCode).toEqual(200);
			const courseResponse = response.body as CourseResponse;
			expect(courseResponse).toBeDefined();
		});
	});
});
