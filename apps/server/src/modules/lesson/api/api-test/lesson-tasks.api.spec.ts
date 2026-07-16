import { EntityManager } from '@mikro-orm/core';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server';
import { taskFactory } from '@modules/task/testing';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { lessonFactory } from '../../testing';

describe('Lesson Controller (API) - GET list of lesson tasks /lessons/:lessonId/tasks', () => {
	let module: TestingModule;
	let app: INestApplication;
	let em: EntityManager;

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
			const course = courseEntityFactory.buildWithId({ teachers: [teacherUser] });
			const lesson = lessonFactory.build({ course });
			const tasks = taskFactory.buildList(3, { creator: teacherUser, lesson });

			await em.persist([teacherAccount, teacherUser, course, lesson, ...tasks]).flush();

			const loggedInClient = await new TestApiClientBuilder(app, baseRouteName).build(teacherAccount);

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
