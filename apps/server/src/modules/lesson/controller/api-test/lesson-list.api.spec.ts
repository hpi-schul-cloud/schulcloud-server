import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory, courseFactory, lessonFactory } from '@shared/testing';
import { LessonMetadataListResponse } from '../dto';

describe('Lesson Controller (API) - GET list of lessons from course /lessons/course/:courseId', () => {
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
		testApiClient = new TestApiClient(app, '/lessons');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when user is a valid teacher', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseFactory.buildWithId({ teachers: [teacherUser] });
			const lesson = lessonFactory.build({ course });
			const hiddenLesson = lessonFactory.build({ course, hidden: true });
			await em.persistAndFlush([teacherAccount, teacherUser, course, lesson, hiddenLesson]);

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, course, lesson, hiddenLesson };
		};

		it('should return a list of all lessons', async () => {
			const { loggedInClient, course, lesson } = await setup();
			const response = await loggedInClient.get(`/course/${course.id}`);
			expect(response.status).toBe(HttpStatus.OK);

			const body = response.body as LessonMetadataListResponse;
			expect(body.data.length).toEqual(2);
			expect(body.data[0]._id).toEqual(lesson.id);
			expect(body.data[0].name).toEqual(lesson.name);
		});
		it('should return hidden lessons', async () => {
			const { loggedInClient, course, hiddenLesson } = await setup();
			const response = await loggedInClient.get(`/course/${course.id}`);
			expect(response.status).toBe(HttpStatus.OK);

			const body = response.body as LessonMetadataListResponse;
			expect(body.data.length).toEqual(2);
			expect(body.data[1]._id).toEqual(hiddenLesson.id);
			expect(body.data[1].name).toEqual(hiddenLesson.name);
		});
	});

	describe('when user is a valid student', () => {
		const setup = async () => {
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			const course = courseFactory.buildWithId({ students: [studentUser] });
			const lesson = lessonFactory.build({ course });
			const hiddenLesson = lessonFactory.build({ course, hidden: true });

			await em.persistAndFlush([studentAccount, studentUser, course, lesson, hiddenLesson]);

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, course, lesson, hiddenLesson };
		};
		it('should return a list of lessons', async () => {
			const { loggedInClient, course, lesson } = await setup();
			const response = await loggedInClient.get(`/course/${course.id}`);
			expect(response.status).toBe(HttpStatus.OK);

			const body = response.body as LessonMetadataListResponse;

			expect(body.data.length).toEqual(1);
			expect(body.data[0]._id).toEqual(lesson.id);
			expect(body.data[0].name).toEqual(lesson.name);
		});
		it('should not return hidden lessons', async () => {
			const { loggedInClient, course, hiddenLesson } = await setup();

			const response = await loggedInClient.get(`/course/${course.id}`);
			expect(response.status).toBe(HttpStatus.OK);
			const body = response.body as LessonMetadataListResponse;

			expect(body.data.find((lesson) => lesson._id === hiddenLesson.id)).toBeUndefined();
		});
	});

	describe('when user is not authorized', () => {
		const setup = async () => {
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			const course = courseFactory.buildWithId({ students: [] });
			const lesson = lessonFactory.build({ course });
			await em.persistAndFlush([studentAccount, studentUser, course, lesson]);

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, course, lesson };
		};
		it('should return status 404', async () => {
			const { loggedInClient, course } = await setup();
			const response = await loggedInClient.get(`/course/${course.id}`);
			expect(response.status).toBe(HttpStatus.NOT_FOUND);
		});
	});
});
