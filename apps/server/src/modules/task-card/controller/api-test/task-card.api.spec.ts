import { Configuration } from '@hpi-schul-cloud/commons';
import { Test, TestingModule } from '@nestjs/testing';

import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { sanitizeRichText } from '@shared/controller';

import { CardElement, CardElementType, InputFormat, Permission, Task, TaskCard } from '@shared/domain';
import {
	TestRequest,
	UserAndAccountTestFactory,
	cleanupCollections,
	courseFactory,
	mapUserToCurrentUser,
	richTextCardElementFactory,
	roleFactory,
	taskCardFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { TaskCardResponse } from '@src/modules/task-card/controller/dto';
import { Request } from 'express';
import request from 'supertest';

const createStudent = () => {
	const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({}, [
		Permission.TASK_CARD_VIEW,
		Permission.TASK_CARD_EDIT,
		Permission.TASK_DASHBOARD_VIEW_V3,
		Permission.HOMEWORK_VIEW,
		Permission.HOMEWORK_CREATE,
	]);
	return { account: studentAccount, user: studentUser };
};

const createTeacher = () => {
	const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [
		Permission.TASK_DASHBOARD_TEACHER_VIEW_V3,
	]);
	return { account: teacherAccount, user: teacherUser };
};

const inTwoDays = new Date(Date.now() + 172800000);
const inThreeDays = new Date(Date.now() + 259200000);
const inFourDays = new Date(Date.now() + 345600000);

// rewrite tests to conform new code style
describe('Task-Card Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let apiRequest: TestRequest;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		apiRequest = new TestRequest(app, 'cards/task');
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
				return { account, teacher: user, course };
			};
			it('should return new a task card', async () => {
				const { account, course } = await setup();

				const taskCardParams = {
					title: 'test title',
					cardElements: [
						{
							content: {
								type: 'richText',
								value: 'rich 2',
								inputFormat: 'richtext_ck5',
							},
						},
						{
							content: {
								type: 'richText',
								value: 'rich 2',
								inputFormat: 'richtext_ck5',
							},
						},
					],
					courseId: course.id,
					dueDate: inTwoDays,
				};

				const { body, statusCode } = await apiRequest.post(undefined, taskCardParams, account);
				const responseTaskCard = body as TaskCardResponse;

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
				const { account, course } = await setup();

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

				const { body, statusCode } = await apiRequest.post(undefined, taskCardParams, account);
				const responseTaskCard = body as TaskCardResponse;
				expect(statusCode).toEqual(201);
				const richTextElement = responseTaskCard.cardElements?.filter(
					(element) => element.cardElementType === CardElementType.RichText
				);
				if (richTextElement?.[0]?.content) {
					expect(richTextElement[0].content.value).toEqual(sanitizedText);
				}
			});

			it('should throw if feature is NOT enabled', async () => {
				const { account, course } = await setup();
				Configuration.set('FEATURE_TASK_CARD_ENABLED', false);

				const taskCardParams = {
					title: 'title',
					courseId: course.id,
					dueDate: inThreeDays,
				};
				const { statusCode } = await apiRequest.post(undefined, taskCardParams, account);
				expect(statusCode).toEqual(500);
			});
			it('should throw if courseId is empty', async () => {
				const { account } = await setup();

				const taskCardParams = {
					title: 'test title',
					cardElements: [],
					courseId: '',
				};
				const { statusCode } = await apiRequest.post(undefined, taskCardParams, account);
				expect(statusCode).toEqual(400);
			});
			it('should throw if no course is matching', async () => {
				const { account } = await setup();

				const taskCardParams = {
					title: 'test title',
					cardElements: [],
					courseId: new ObjectId().toHexString(),
				};
				const { statusCode } = await apiRequest.post(undefined, taskCardParams, account);
				expect(statusCode).toEqual(400);
			});
			it('should throw if dueDate is empty', async () => {
				const { account, course } = await setup();

				const taskCardParams = {
					title: 'test title',
					cardElements: [],
					courseId: course.id,
				};

				const { statusCode } = await apiRequest.post(undefined, taskCardParams, account);
				expect(statusCode).toEqual(400);
			});
			it('should throw if dueDate is earlier than today', async () => {
				const { account, course } = await setup();

				const taskCardParams = {
					title: 'test title',
					cardElements: [],
					courseId: course.id,
					dueDate: new Date(Date.now() - 259200000),
				};
				const { statusCode } = await apiRequest.post(undefined, taskCardParams, account);
				expect(statusCode).toEqual(400);
			});
			it('should throw if title is empty', async () => {
				const { account } = await setup();

				const taskCardParams = {
					title: '',
				};

				const { statusCode } = await apiRequest.post(undefined, taskCardParams, account);
				expect(statusCode).toEqual(400);
			});
			it('should throw if title is not a string', async () => {
				const { account } = await setup();

				const taskCardParams = {
					title: 1234,
				};

				const { statusCode } = await apiRequest.post(undefined, taskCardParams, account);
				expect(statusCode).toEqual(501);
			});
			it('should throw if title is not provided', async () => {
				const { account } = await setup();

				const taskCardParams = {};

				const { statusCode } = await apiRequest.post(undefined, taskCardParams, account);
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
			return { account, teacher: user, course, task, taskCard };
		};

		describe('when teacher and taskcard is given', () => {
			it('should return existing task-card', async () => {
				const { account, taskCard } = await setup();

				const { body, statusCode } = await apiRequest.get(`${taskCard.id}`, account);
				const responseTaskCard = body as TaskCardResponse;

				expect(statusCode).toBe(200);
				expect(responseTaskCard.id).toEqual(taskCard.id);
			});

			it('should throw if feature not enabled', async () => {
				const { account, taskCard } = await setup();
				Configuration.set('FEATURE_TASK_CARD_ENABLED', false);

				const { statusCode } = await apiRequest.get(`${taskCard.id}`, account);
				expect(statusCode).toBe(500);
			});
		});
	});
});

describe('Task-Card Controller (api) 2', () => {
	let app: INestApplication;
	let em: EntityManager;
	const inTwoDays = new Date(Date.now() + 172800000);
	const inThreeDays = new Date(Date.now() + 259200000);
	const inFourDays = new Date(Date.now() + 345600000);

	let currentUser: ICurrentUser;

	const setupUser = (permissions: Permission[]) => {
		const roles = roleFactory.buildList(1, {
			permissions,
		});
		const user = userFactory.build({ roles });

		return user;
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					return true;
				},
			})
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		Configuration.set('FEATURE_TASK_CARD_ENABLED', true);
	});

	describe('[PATCH] /cards/task/:id', () => {
		it('should update the task card', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_EDIT]);

			const title = 'title test';
			const richTextCardElement = richTextCardElementFactory.buildWithId();
			// for some reason taskCard factory messes up the creator of task, so it needs to be separated
			const task = taskFactory.build({ name: title, creator: user });
			const taskCard = taskCardFactory.buildWithId({ creator: user, task });
			const course = courseFactory.buildWithId({ teachers: [user], untilDate: inFourDays });

			await em.persistAndFlush([user, task, taskCard, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardUpdateParams = {
				title: 'updated title',
				cardElements: [
					{
						id: richTextCardElement.id,
						content: {
							type: 'richText',
							value: 'rich updated',
							inputFormat: 'richtext_ck5',
						},
					},
					{
						content: {
							type: 'richText',
							value: 'rich added',
							inputFormat: 'richtext_ck5',
						},
					},
				],
				visibleAtDate: inTwoDays,
				dueDate: inThreeDays,
				courseId: course.id,
			};
			const response = await request(app.getHttpServer())
				.patch(`/cards/task/${taskCard.id}`)
				.set('Accept', 'application/json')
				.send(taskCardUpdateParams)
				.expect(200);

			const responseTaskCard = response.body as TaskCardResponse;

			expect(responseTaskCard.id).toEqual(taskCard.id);
			expect(responseTaskCard.title).toEqual(taskCardUpdateParams.title);
			expect(responseTaskCard.cardElements?.length).toEqual(2);
			expect(new Date(responseTaskCard.visibleAtDate)).toEqual(inTwoDays);
			expect(new Date(responseTaskCard.dueDate)).toEqual(inThreeDays);
		});
		it('should sanitize richtext on update with inputformat ck5', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_EDIT]);
			// for some reason taskCard factory messes up the creator of task, so it needs to be separated
			const task = taskFactory.build({ creator: user });
			const taskCard = taskCardFactory.buildWithId({ creator: user, task });
			const course = courseFactory.buildWithId({ teachers: [user], untilDate: inThreeDays });

			await em.persistAndFlush([user, task, taskCard, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

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

			const response = await request(app.getHttpServer())
				.patch(`/cards/task/${taskCard.id}`)
				.set('Accept', 'application/json')
				.send(taskCardUpdateParams)
				.expect(200);

			const responseTaskCard = response.body as TaskCardResponse;
			const richTextElement = responseTaskCard.cardElements?.filter(
				(element) => element.cardElementType === CardElementType.RichText
			);
			const expectedRichTextElement = richTextElement ? richTextElement[0].content.value : '';
			expect(expectedRichTextElement).toEqual(sanitizedText);
		});
		it('should throw if feature is not enabled', async () => {
			await cleanupCollections(em);
			Configuration.set('FEATURE_TASK_CARD_ENABLED', false);
			const user = setupUser([]);
			const taskCard = taskCardFactory.build({ creator: user });
			const course = courseFactory.buildWithId({ teachers: [user] });

			await em.persistAndFlush([user, taskCard, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
			const params = {
				title: 'title',
				courseId: course.id,
				dueDate: inThreeDays,
			};
			await request(app.getHttpServer())
				.patch(`/cards/task/${taskCard.id}`)
				.set('Accept', 'application/json')
				.send(params)
				.expect(500);
		});
	});
	describe('[DELETE] /cards/task/:id', () => {
		it('should remove task-card, its card-elements and associated task', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_EDIT]);
			// for some reason taskCard factory messes up the creator of task, so it needs to be separated
			const task = taskFactory.build({ creator: user });
			const taskCard = taskCardFactory.build({
				creator: user,
				cardElements: [richTextCardElementFactory.buildWithId()],
				task,
			});

			await em.persistAndFlush([user, task, taskCard]);
			em.clear();

			const cardElementsIds = taskCard.getCardElements().map((element) => element.id);
			const foundCardElementsInitial = await em.findAndCount(CardElement, { id: { $in: cardElementsIds } });
			expect(foundCardElementsInitial[1]).toEqual(1);

			currentUser = mapUserToCurrentUser(user);

			await request(app.getHttpServer())
				.delete(`/cards/task/${taskCard.id}`)
				.set('Accept', 'application/json')
				.expect(200);

			const foundCardElements = await em.findAndCount(CardElement, { id: { $in: cardElementsIds } });
			expect(foundCardElements[1]).toEqual(0);

			const foundTask = await em.findOne(Task, { id: taskCard.task.id });
			expect(foundTask).toEqual(null);

			const foundTaskCard = await em.findOne(TaskCard, { id: taskCard.id });
			expect(foundTaskCard).toEqual(null);
		});
		it('should throw if feature is not enabled', async () => {
			await cleanupCollections(em);
			Configuration.set('FEATURE_TASK_CARD_ENABLED', false);
			const user = setupUser([]);

			const taskCard = taskCardFactory.build({ creator: user });

			await em.persistAndFlush([user, taskCard]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			await request(app.getHttpServer())
				.delete(`/cards/task/${taskCard.id}`)
				.set('Accept', 'application/json')
				.expect(500);
		});
	});
});
