import { Configuration } from '@hpi-schul-cloud/commons';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { sanitizeRichText } from '@shared/controller';
import { CardElementType, InputFormat, Permission } from '@shared/domain';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cleanupCollections,
	courseFactory,
	richTextCardElementFactory,
	taskCardFactory,
	taskFactory,
} from '@shared/testing';
import { ServerTestModule } from '@src/modules/server/server.module';
import { TaskCardResponse } from '@src/modules/task-card/controller/dto';

const createTeacher = () => {
	const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [
		Permission.TASK_DASHBOARD_TEACHER_VIEW_V3,
	]);
	return { account: teacherAccount, user: teacherUser };
};

const inTwoDays = new Date(Date.now() + 172800000);
const inThreeDays = new Date(Date.now() + 259200000);

describe('Task-Card Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'cards/task');
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		Configuration.set('FEATURE_TASK_CARD_ENABLED', true);
	});

	describe('[POST] /cards/task', () => {
		describe('when a teacher of a course is given', () => {
			const setup = async () => {
				const { account, user } = createTeacher();
				const course = courseFactory.build({ teachers: [user] });

				await em.persistAndFlush([account, user, course]);
				em.clear();

				const loggedInClient = await testApiClient.login(account);

				return { loggedInClient, teacher: user, course };
			};
			it('should return new a task card', async () => {
				const { loggedInClient, course } = await setup();

				const taskCardParams = {
					title: 'test title',
					cardElements: [
						{
							content: {
								type: 'richText',
								value: 'rich 2',
								inputFormat: 'richTextCk5',
							},
						},
						{
							content: {
								type: 'richText',
								value: 'rich 2',
								inputFormat: 'richTextCk5',
							},
						},
					],
					courseId: course.id,
					dueDate: inTwoDays,
				};

				const response = await loggedInClient.post(undefined, taskCardParams);
				const { statusCode } = response;
				const responseTaskCard = response.body as TaskCardResponse;

				expect(statusCode).toEqual(201);
				expect(responseTaskCard.cardElements?.length).toEqual(2);
				expect(responseTaskCard.task.name).toEqual('test title');
				expect(responseTaskCard.title).toEqual('test title');
				expect(responseTaskCard.visibleAtDate).toBeDefined();
				expect(responseTaskCard.dueDate).toBe(inTwoDays.toISOString());
				expect(responseTaskCard.courseId).toEqual(course.id);
				expect(responseTaskCard.courseName).toEqual(course.name);
				expect(responseTaskCard.task.taskCardId).toEqual(responseTaskCard.id);
				expect(responseTaskCard.task.status.isDraft).toEqual(false);
			});

			it('should sanitize richtext on create with inputformat ck5', async () => {
				const { loggedInClient, course } = await setup();

				const text = '<iframe>rich text 1</iframe> some more text';

				const taskCardParams = {
					title: 'test title',
					courseId: course.id,
					cardElements: [
						{
							content: {
								type: 'richText',
								value: text,
								inputFormat: InputFormat.RICH_TEXT_CK5,
							},
						},
					],
					dueDate: inTwoDays,
				};

				const sanitizedText = sanitizeRichText(text, InputFormat.RICH_TEXT_CK5);

				const response = await loggedInClient.post(undefined, taskCardParams);
				const { statusCode } = response;
				const responseTaskCard = response.body as TaskCardResponse;
				expect(statusCode).toEqual(201);
				const richTextElement = responseTaskCard.cardElements?.filter(
					(element) => element.cardElementType === CardElementType.RichText
				);
				if (richTextElement?.[0]?.content) {
					expect(richTextElement[0].content.value).toEqual(sanitizedText);
				}
			});

			it('should throw if feature is NOT enabled', async () => {
				const { loggedInClient, course } = await setup();
				Configuration.set('FEATURE_TASK_CARD_ENABLED', false);

				const taskCardParams = {
					title: 'title',
					courseId: course.id,
					dueDate: inThreeDays,
				};
				const { statusCode } = await loggedInClient.post(undefined, taskCardParams);
				expect(statusCode).toEqual(500);
			});
			it('should throw if courseId is empty', async () => {
				const { loggedInClient } = await setup();

				const taskCardParams = {
					title: 'test title',
					cardElements: [],
					courseId: '',
				};
				const { statusCode } = await loggedInClient.post(undefined, taskCardParams);
				expect(statusCode).toEqual(400);
			});
			it('should throw if no course is matching', async () => {
				const { loggedInClient } = await setup();

				const taskCardParams = {
					title: 'test title',
					cardElements: [],
					courseId: new ObjectId().toHexString(),
				};
				const { statusCode } = await loggedInClient.post(undefined, taskCardParams);
				expect(statusCode).toEqual(400);
			});
			it('should throw if dueDate is empty', async () => {
				const { loggedInClient, course } = await setup();

				const taskCardParams = {
					title: 'test title',
					cardElements: [],
					courseId: course.id,
				};

				const { statusCode } = await loggedInClient.post(undefined, taskCardParams);
				expect(statusCode).toEqual(400);
			});
			it('should throw if dueDate is earlier than today', async () => {
				const { loggedInClient, course } = await setup();

				const taskCardParams = {
					title: 'test title',
					cardElements: [],
					courseId: course.id,
					dueDate: new Date(Date.now() - 259200000),
				};
				const { statusCode } = await loggedInClient.post(undefined, taskCardParams);
				expect(statusCode).toEqual(400);
			});
			it('should throw if title is empty', async () => {
				const { loggedInClient } = await setup();

				const taskCardParams = {
					title: '',
				};

				const { statusCode } = await loggedInClient.post(undefined, taskCardParams);
				expect(statusCode).toEqual(400);
			});
			it('should throw if title is not a string', async () => {
				const { loggedInClient } = await setup();

				const taskCardParams = {
					title: 1234,
				};

				const { statusCode } = await loggedInClient.post(undefined, taskCardParams);
				expect(statusCode).toEqual(501);
			});
			it('should throw if title is not provided', async () => {
				const { loggedInClient } = await setup();

				const taskCardParams = {};

				const { statusCode } = await loggedInClient.post(undefined, taskCardParams);
				expect(statusCode).toEqual(400);
			});
		});
	});

	describe('[GET] /cards/task/:id', () => {
		const setup = async () => {
			const { account, user } = createTeacher();
			const course = courseFactory.build({ teachers: [user] });
			// for some reason taskCard factory messes up the creator of task, so it needs to be separated
			const task = taskFactory.build({ name: 'title', creator: user });
			const taskCard = taskCardFactory.buildWithId({ creator: user, task });
			await em.persistAndFlush([account, user, course, task, taskCard]);
			em.clear();

			const loggedInClient = await testApiClient.login(account);

			return { loggedInClient, teacher: user, course, task, taskCard };
		};

		describe('when teacher and taskcard is given', () => {
			it('should return existing task-card', async () => {
				const { loggedInClient, taskCard } = await setup();

				const response = await loggedInClient.get(`${taskCard.id}`);
				const { statusCode } = response;
				const responseTaskCard = response.body as TaskCardResponse;

				expect(statusCode).toBe(200);
				expect(responseTaskCard.id).toEqual(taskCard.id);
			});

			it('should throw if feature not enabled', async () => {
				const { loggedInClient, taskCard } = await setup();
				Configuration.set('FEATURE_TASK_CARD_ENABLED', false);

				const { statusCode } = await loggedInClient.get(`${taskCard.id}`);
				expect(statusCode).toBe(500);
			});
		});
	});

	describe('[PATCH] /cards/task/:id', () => {
		describe('when teacher and taskcard is given', () => {
			const setup = async () => {
				const { account, user } = createTeacher();
				const course = courseFactory.build({ teachers: [user] });
				// for some reason taskCard factory messes up the creator of task, so it needs to be separated
				const task = taskFactory.build({ name: 'title', creator: user });
				const taskCard = taskCardFactory.buildWithId({ creator: user, task });
				await em.persistAndFlush([account, user, course, task, taskCard]);
				em.clear();

				const loggedInClient = await testApiClient.login(account);

				return { loggedInClient, teacher: user, course, task, taskCard };
			};

			it('should update the task card', async () => {
				const { loggedInClient, taskCard, course } = await setup();

				const richTextCardElement = richTextCardElementFactory.buildWithId();

				const taskCardUpdateParams = {
					title: 'updated title',
					cardElements: [
						{
							id: richTextCardElement.id,
							content: {
								type: 'richText',
								value: 'rich updated',
								inputFormat: 'richTextCk5',
							},
						},
						{
							content: {
								type: 'richText',
								value: 'rich added',
								inputFormat: 'richTextCk5',
							},
						},
					],
					visibleAtDate: inTwoDays,
					dueDate: inThreeDays,
					courseId: course.id,
				};

				const response = await loggedInClient.patch(`${taskCard.id}`, taskCardUpdateParams);
				const { statusCode } = response;
				const responseTaskCard = response.body as TaskCardResponse;

				expect(statusCode).toBe(200);
				expect(responseTaskCard.id).toEqual(taskCard.id);
				expect(responseTaskCard.title).toEqual(taskCardUpdateParams.title);
				expect(responseTaskCard.cardElements?.length).toEqual(2);
				expect(new Date(responseTaskCard.visibleAtDate)).toEqual(inTwoDays);
				expect(new Date(responseTaskCard.dueDate)).toEqual(inThreeDays);
			});

			it('should sanitize richtext on update with inputformat ck5', async () => {
				const { loggedInClient, taskCard, course } = await setup();

				const text = '<iframe>rich text 1</iframe> some more text';
				const sanitizedText = sanitizeRichText(text, InputFormat.RICH_TEXT_CK5);

				const taskCardUpdateParams = {
					title: 'test title updated',
					courseId: course.id,
					cardElements: [
						{
							content: {
								type: 'richText',
								value: text,
								inputFormat: InputFormat.RICH_TEXT_CK5,
							},
						},
					],
					dueDate: inTwoDays,
				};

				const response = await loggedInClient.patch(`${taskCard.id}`, taskCardUpdateParams);
				const { statusCode } = response;
				const responseTaskCard = response.body as TaskCardResponse;

				expect(statusCode).toBe(200);
				const richTextElement = responseTaskCard.cardElements?.filter(
					(element) => element.cardElementType === CardElementType.RichText
				);
				const expectedRichTextElement = richTextElement ? richTextElement[0].content.value : '';
				expect(expectedRichTextElement).toEqual(sanitizedText);
			});

			it('should throw if feature is not enabled', async () => {
				const { loggedInClient, course, taskCard } = await setup();
				Configuration.set('FEATURE_TASK_CARD_ENABLED', false);

				const taskCardUpdateParams = {
					title: 'title',
					courseId: course.id,
					dueDate: inThreeDays,
				};

				const { statusCode } = await loggedInClient.patch(`${taskCard.id}`, taskCardUpdateParams);

				expect(statusCode).toBe(500);
			});
		});
	});

	describe('[DELETE] /cards/task/:id', () => {
		describe('when logged in as a teacher', () => {
			const setup = async () => {
				const { account, user } = createTeacher();
				const course = courseFactory.build({ teachers: [user] });
				// for some reason taskCard factory messes up the creator of task, so it needs to be separated
				const task = taskFactory.build({ name: 'title', creator: user });
				const taskCard = taskCardFactory.buildWithId({ creator: user, task });
				await em.persistAndFlush([account, user, course, task, taskCard]);
				em.clear();

				const teacherClient = await testApiClient.login(account);

				return { teacherClient, teacher: user, course, task, taskCard };
			};

			it('should return status 200 for valid task card', async () => {
				const { teacherClient, taskCard } = await setup();

				const response = await teacherClient.delete(`${taskCard.id}`);

				expect(response.status).toEqual(200);
			});
		});
	});
});
