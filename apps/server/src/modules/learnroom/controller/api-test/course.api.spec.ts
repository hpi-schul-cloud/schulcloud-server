import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain';
import {
	cleanupCollections,
	courseFactory,
	mapUserToCurrentUser,
	roleFactory,
	TestRequest,
	UserAndAccountTestFactory,
	userFactory,
} from '@shared/testing';
import {
	CourseMetadataListResponse,
	CourseMetadataResponse,
	CourseResponse,
} from '@src/modules/learnroom/controller/dto';
import { ServerTestModule } from '@src/modules/server/server.module';
import request from 'supertest';

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
			const course = courseFactory.build({ name: 'course #1', teachers: [teacher.user], students: [student.user] });

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
			const student = createStudent();
			const teacher = createTeacher();
			const course = courseFactory.build({ name: 'course #1', teachers: [teacher.user], students: [student.user] });

			return { student, course, teacher };
		};
		it('should find course', async () => {
			const { course, teacher } = setup();
			await em.persistAndFlush([teacher.user, teacher.account, course]);

			em.clear();

			const response = await apiRequest.get(undefined, teacher.account);
			const { data } = response.body as CourseMetadataResponse;

			expect(response.statusCode).toEqual(200);
			expect(data).toBeDefined();
			expect(courseResponse.id).toEqual(course.id);
			expect(courseResponse.students?.length).toEqual(2);
		});
		it('should throw if user is not teacher', async () => {
			const { teacher } = setup();
			const unknownTeacher = userFactory.build({ teacher });
			const course = courseFactory.build({ name: 'course #1', teachers: [unknownTeacher] });

			await em.persistAndFlush(course);
			em.clear();
			currentUser = mapUserToCurrentUser(teacher);

			await request(app.getHttpServer()).get(`/courses/${course.id}`).set('Accept', 'application/json').expect(500);
		});
		it('should throw if course is not found', async () => {
			const { teacher, course } = setup();
			const unknownId = new ObjectId().toHexString();

			await em.persistAndFlush(course);
			em.clear();
			currentUser = mapUserToCurrentUser(teacher);

			await request(app.getHttpServer()).get(`/courses/${unknownId}`).set('Accept', 'application/json').expect(404);
		});
	});

	describe('[GET] /courses/:id/export', () => {
		const setup = () => {
			const roles = roleFactory.buildList(1, { permissions: [Permission.COURSE_EDIT] });
			const user = userFactory.build({ roles });

			return { user };
		};
		it('should find course export', async () => {
			if (!Configuration.get('FEATURE_IMSCC_COURSE_EXPORT_ENABLED')) return;
			const { user } = setup();
			const course = courseFactory.build({ name: 'course #1', students: [user] });
			await em.persistAndFlush(course);
			em.clear();
			currentUser = mapUserToCurrentUser(user);

			const response = await request(app.getHttpServer()).get(`/courses/${course.id}/export`);

			expect(response.status).toEqual(200);
			expect(response.body).toBeDefined();
		});
	});
});
