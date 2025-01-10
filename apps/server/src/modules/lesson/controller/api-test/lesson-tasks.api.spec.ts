import { EntityManager } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, lessonFactory, taskFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';

describe('Lesson Controller (API) - GET list of lesson tasks /lessons/:lessonId/tasks', () => {
	let module: TestingModule;
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();
		app = module.createNestApplication();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, '/lessons');

		await app.init();
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	describe('when lesson exists', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseFactory.buildWithId({ teachers: [teacherUser] });
			const lesson = lessonFactory.build({ course });
			const tasks = taskFactory.buildList(3, { creator: teacherUser, lesson });

			await em.persistAndFlush([teacherAccount, teacherUser, course, lesson, ...tasks]);

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, course, lesson, tasks };
		};

		it('should return a list of tasks', async () => {
			const { loggedInClient, lesson } = await setup();

			const response = await loggedInClient.get(`/${lesson.id}/tasks`);

			expect(response.status).toBe(200);
			expect((response.body as []).length).toEqual(3);
		});
	});
});
