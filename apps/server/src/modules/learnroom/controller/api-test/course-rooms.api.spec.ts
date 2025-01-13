import { createMock } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { EntityManager } from '@mikro-orm/mongodb';
import { CopyApiResponse } from '@modules/copy-helper';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { SingleColumnBoardResponse } from '@modules/learnroom/controller/dto';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, LegacyBoard, Task } from '@shared/domain/entity';
import {
	boardFactory,
	cleanupCollections,
	courseFactory,
	lessonFactory,
	taskFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';

describe('Course Rooms Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let apiClient: TestApiClient;

	const setConfig = () => {
		Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(FilesStorageClientAdapterService)
			.useValue(createMock<FilesStorageClientAdapterService>())
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		setConfig();

		apiClient = new TestApiClient(app, '/course-rooms');
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
	});

	describe('[GET] board', () => {
		describe('when user is loggedin', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const course = courseFactory.build({ students: [studentUser] });
				const task = taskFactory.build({ course });

				await em.persistAndFlush([course, task, studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await apiClient.login(studentAccount);

				return { loggedInClient, course };
			};

			it('should return status 200 and courseId', async () => {
				const { loggedInClient, course } = await setup();

				const response = await loggedInClient.get(`${course.id}/board`);

				expect(response.status).toEqual(200);
				const body = response.body as SingleColumnBoardResponse;
				expect(body.roomId).toEqual(course.id);
			});
		});

		describe('when user is not loggedin', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const course = courseFactory.build({ students: [studentUser] });
				const task = taskFactory.build({ course });

				await em.persistAndFlush([course, task, studentAccount, studentUser]);
				em.clear();

				return { course };
			};

			it('should return status 200 and courseId', async () => {
				const { course } = await setup();

				const response = await apiClient.get(`${course.id}/board`);

				expect(response.status).toEqual(401);
			});
		});
	});

	describe('[PATCH] ElementVisibility', () => {
		describe('when user is loggedin', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseFactory.build({ teachers: [teacherUser] });
				const board = boardFactory.buildWithId({ course });
				const task = taskFactory.draft().build({ course });
				board.syncBoardElementReferences([task]);

				await em.persistAndFlush([course, board, task, teacherAccount, teacherUser]);
				em.clear();

				const params = { visibility: true };

				const loggedInClient = await apiClient.login(teacherAccount);

				return { loggedInClient, course, task, params };
			};

			it('should return 200', async () => {
				const { loggedInClient, course, task, params } = await setup();

				const response = await loggedInClient.patch(`${course.id}/elements/${task.id}/visibility`).send(params);

				expect(response.status).toEqual(200);
			});

			it('should make task visible', async () => {
				const { loggedInClient, course, task, params } = await setup();

				await loggedInClient.patch(`${course.id}/elements/${task.id}/visibility`).send(params);
				const updatedTask = await em.findOneOrFail(Task, task.id);

				expect(updatedTask.isDraft()).toEqual(false);
			});

			it('should make task invisibible', async () => {
				const { loggedInClient, course, task } = await setup();

				const params = { visibility: false };

				await loggedInClient.patch(`/course-rooms/${course.id}/elements/${task.id}/visibility`).send(params);
				const updatedTask = await em.findOneOrFail(Task, task.id);

				expect(updatedTask.isDraft()).toEqual(true);
			});
		});

		describe('when user is not loggedin', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseFactory.build({ teachers: [teacherUser] });
				const board = boardFactory.buildWithId({ course });
				const task = taskFactory.draft().build({ course });
				board.syncBoardElementReferences([task]);

				await em.persistAndFlush([course, board, task, teacherAccount, teacherUser]);
				em.clear();

				const params = { visibility: true };

				return { course, task, params };
			};

			it('should return 401', async () => {
				const { course, task, params } = await setup();

				const response = await apiClient.patch(`${course.id}/elements/${task.id}/visibility`).send(params);

				expect(response.status).toEqual(401);
			});
		});
	});

	describe('[PATCH] order', () => {
		describe('when user is logged in', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseFactory.build({ teachers: [teacherUser] });
				const board = boardFactory.buildWithId({ course });
				const tasks = taskFactory.buildList(3, { course });
				const lessons = lessonFactory.buildList(3, { course });
				board.syncBoardElementReferences([...tasks, ...lessons]);

				await em.persistAndFlush([course, board, ...tasks, ...lessons, teacherAccount, teacherUser]);
				em.clear();

				const params = {
					elements: [tasks[2], lessons[1], tasks[0], lessons[2], tasks[1], lessons[0]].map((el) => el.id),
				};

				const loggedInClient = await apiClient.login(teacherAccount);

				return { loggedInClient, course, params };
			};

			it('should return 200', async () => {
				const { loggedInClient, course, params } = await setup();

				const response = await loggedInClient.patch(`${course.id}/board/order`).send(params);

				expect(response.status).toEqual(200);
			});
		});

		describe('when user is not logged in', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseFactory.build({ teachers: [teacherUser] });
				const board = boardFactory.buildWithId({ course });
				const tasks = taskFactory.buildList(3, { course });
				const lessons = lessonFactory.buildList(3, { course });
				board.syncBoardElementReferences([...tasks, ...lessons]);

				await em.persistAndFlush([course, board, ...tasks, ...lessons, teacherAccount, teacherUser]);
				em.clear();

				const params = {
					elements: [tasks[2], lessons[1], tasks[0], lessons[2], tasks[1], lessons[0]].map((el) => el.id),
				};

				return { course, params };
			};

			it('should return 401', async () => {
				const { course, params } = await setup();

				const response = await apiClient.patch(`${course.id}/board/order`).send(params);

				expect(response.status).toEqual(401);
			});
		});
	});

	describe('[POST] copy', () => {
		describe('when user is logged in', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseFactory.build({ teachers: [teacherUser] });
				const board = boardFactory.build({ course });
				const tasks = taskFactory.buildList(3, { course });
				const lessons = lessonFactory.buildList(3, { course });
				board.syncBoardElementReferences([...tasks, ...lessons]);

				await em.persistAndFlush([course, teacherAccount, teacherUser, board, ...tasks, ...lessons]);
				em.clear();

				const loggedInClient = await apiClient.login(teacherAccount);

				return { loggedInClient, course };
			};

			it('should return 201', async () => {
				const { loggedInClient, course } = await setup();

				const response = await loggedInClient.post(`${course.id}/copy`);

				expect(response.status).toEqual(201);
			});

			it('should return id of copied element', async () => {
				const { loggedInClient, course } = await setup();

				const response = await loggedInClient.post(`${course.id}/copy`);

				const body = response.body as CopyApiResponse;
				expect(body.id).toBeDefined();

				expect(() => em.findOneOrFail(Course, body.id as string)).not.toThrow();
			});

			it('should persist board of room copy', async () => {
				const { loggedInClient, course } = await setup();

				const response = await loggedInClient.post(`${course.id}/copy`);

				const body = response.body as CopyApiResponse;
				expect(body.id).toBeDefined();

				expect(() => em.findOneOrFail(LegacyBoard, { course: body.id as string })).not.toThrow();
			});
		});

		describe('when user is not logged in', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseFactory.build({ teachers: [teacherUser] });
				const board = boardFactory.build({ course });
				const tasks = taskFactory.buildList(3, { course });
				const lessons = lessonFactory.buildList(3, { course });
				board.syncBoardElementReferences([...tasks, ...lessons]);

				await em.persistAndFlush([course, teacherAccount, teacherUser, board, ...tasks, ...lessons]);
				em.clear();

				return { course };
			};

			it('should return 401', async () => {
				const { course } = await setup();

				const response = await apiClient.post(`${course.id}/copy`);

				expect(response.status).toEqual(401);
			});
		});
	});

	describe('[POST] lesson copy', () => {
		describe('when user is logged in', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseFactory.build({ teachers: [teacherUser] });
				const lesson = lessonFactory.build({ course });

				await em.persistAndFlush([lesson, course, teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await apiClient.login(teacherAccount);

				return { loggedInClient, course, lesson };
			};

			it('should return 201', async () => {
				const { loggedInClient, course, lesson } = await setup();

				const response = await loggedInClient.post(`lessons/${lesson.id}/copy`, { courseId: course.id });

				expect(response.status).toEqual(201);
			});
		});

		describe('when user is not logged in', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseFactory.build({ teachers: [teacherUser] });
				const lesson = lessonFactory.build({ course });

				await em.persistAndFlush([lesson, course, teacherAccount, teacherUser]);
				em.clear();

				return { course, lesson };
			};

			it('should return 401', async () => {
				const { course, lesson } = await setup();

				const response = await apiClient.post(`lessons/${lesson.id}/copy`, { courseId: course.id });

				expect(response.status).toEqual(401);
			});
		});
	});
});
