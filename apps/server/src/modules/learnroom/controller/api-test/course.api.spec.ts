import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain';
import { cleanupCollections, courseFactory, TestRequest, UserAndAccountTestFactory } from '@shared/testing';
import {
	CourseMetadataListResponse,
	CourseMetadataResponse,
	CourseResponse,
} from '@src/modules/learnroom/controller/dto';
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
	let apiRequest: TestRequest;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		apiRequest = new TestRequest(app, 'courses');
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

			const response = await apiRequest.get(undefined, student.account);

			const { data } = response.body as CourseMetadataListResponse;
			expect(response.statusCode).toBe(200);
			expect(typeof data[0].title).toBe('string');
		});
		it('should find courses as teacher', async () => {
			const { teacher, course } = setup();
			await em.persistAndFlush([teacher.account, teacher.user, course]);
			em.clear();

			const response = await apiRequest.get(undefined, teacher.account);

			const { data } = response.body as CourseMetadataListResponse;
			expect(response.statusCode).toBe(200);
			expect(typeof data[0].title).toBe('string');
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

			return { course, teacher, teacherUnkownToCourse, substitutionTeacher, student1 };
		};
		// TODO find course as teacher, substitute teacher and student
		it('should find course as teacher', async () => {
			const { course, teacher } = setup();
			await em.persistAndFlush([teacher.user, teacher.account, course]);

			em.clear();

			const response = await apiRequest.get(`${course.id}`, teacher.account);
			const courseResponse = response.body as CourseResponse;

			expect(response.statusCode).toEqual(200);
			expect(courseResponse).toBeDefined();
			expect(courseResponse.id).toEqual(course.id);
			expect(courseResponse.students?.length).toEqual(2);
		});
		it('should find course as substitution teacher', async () => {
			const { course, substitutionTeacher } = setup();
			await em.persistAndFlush([substitutionTeacher.user, substitutionTeacher.account, course]);

			em.clear();

			const response = await apiRequest.get(`${course.id}`, substitutionTeacher.account);
			const courseResponse = response.body as CourseResponse;

			expect(response.statusCode).toEqual(200);
			expect(courseResponse).toBeDefined();
			expect(courseResponse.id).toEqual(course.id);
			expect(courseResponse.students?.length).toEqual(2);
		});
		it('should find course as student', async () => {
			const { course, student1: student } = setup();
			await em.persistAndFlush([student.user, student.account, course]);

			em.clear();

			const response = await apiRequest.get(`${course.id}`, student.account);
			const courseResponse = response.body as CourseResponse;

			expect(response.statusCode).toEqual(200);
			expect(courseResponse).toBeDefined();
			expect(courseResponse.id).toEqual(course.id);
			expect(courseResponse.students?.length).toEqual(2);
		});
		it('should not find course if the teacher is not assigned to', async () => {
			const { teacherUnkownToCourse, course } = setup();

			await em.persistAndFlush([course, teacherUnkownToCourse.account, teacherUnkownToCourse.user]);
			em.clear();

			const response = await apiRequest.get(`${course.id}`, teacherUnkownToCourse.account);
			expect(response.statusCode).toEqual(404);
		});
		it('should not find course if id does not exist', async () => {
			const { teacher, course } = setup();
			const unknownId = new ObjectId().toHexString();

			await em.persistAndFlush([course, teacher.account, teacher.user]);
			em.clear();

			const response = await apiRequest.get(`${unknownId}`, teacher.account);
			expect(response.statusCode).toEqual(404);
		});
	});

	// describe('[GET] /courses/:id/export', () => {
	// 	const setup = () => {
	// 		const roles = roleFactory.buildList(1, { permissions: [Permission.COURSE_EDIT] });
	// 		const user = userFactory.build({ roles });

	// 		return { user };
	// 	};
	// 	it('should find course export', async () => {
	// 		if (!Configuration.get('FEATURE_IMSCC_COURSE_EXPORT_ENABLED')) return;
	// 		const { user } = setup();
	// 		const course = courseFactory.build({ name: 'course #1', students: [user] });
	// 		await em.persistAndFlush(course);
	// 		em.clear();

	// 		const response = await request(app.getHttpServer()).get(`/courses/${course.id}/export`);

	// 		expect(response.status).toEqual(200);
	// 		expect(response.body).toBeDefined();
	// 	});
	// });
});
