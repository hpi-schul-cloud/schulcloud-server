import { Configuration } from '@hpi-schul-cloud/commons';
import { Test, TestingModule } from '@nestjs/testing';

import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { sanitizeRichText } from '@shared/controller';

import { CardElement, CardElementType, InputFormat, Permission, Task, TaskCard } from '@shared/domain';
import {
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

describe('Task-Card Controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	const tomorrow = new Date(Date.now() + 86400000);
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

	describe('[POST] /cards/task', () => {
		it('should return new task-card', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_CREATE, Permission.HOMEWORK_EDIT]);
			const course = courseFactory.buildWithId({ teachers: [user], untilDate: inThreeDays });

			await em.persistAndFlush([user, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

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
				visibleAtDate: tomorrow,
			};
			const response = await request(app.getHttpServer())
				.post(`/cards/task/`)
				.set('Accept', 'application/json')
				.send(taskCardParams)
				.expect(201);

			const responseTaskCard = response.body as TaskCardResponse;

			expect(responseTaskCard.cardElements?.length).toEqual(2);
			expect(responseTaskCard.task.name).toEqual('test title');
			expect(responseTaskCard.title).toEqual('test title');
			expect(responseTaskCard.visibleAtDate).toEqual(tomorrow.toISOString());
			expect(responseTaskCard.dueDate).toBe(inTwoDays.toISOString());
			expect(responseTaskCard.courseId).toEqual(course.id);
			expect(responseTaskCard.courseName).toEqual(course.name);
			expect(responseTaskCard.task.taskCardId).toEqual(responseTaskCard.id);
			expect(responseTaskCard.task.status.isDraft).toEqual(false);
		});
		it('should sanitize richtext on create with inputformat ck5', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_CREATE, Permission.HOMEWORK_EDIT]);
			const course = courseFactory.buildWithId({ teachers: [user], untilDate: inThreeDays });

			await em.persistAndFlush([user, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

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

			const response = await request(app.getHttpServer())
				.post(`/cards/task/`)
				.set('Accept', 'application/json')
				.send(taskCardParams)
				.expect(201);

			const responseTaskCard = response.body as TaskCardResponse;
			const richTextElement = responseTaskCard.cardElements?.filter(
				(element) => element.cardElementType === CardElementType.RichText
			);
			if (richTextElement?.[0]?.content) {
				expect(richTextElement[0].content.value).toEqual(sanitizedText);
			}
		});
		it('should throw if feature is NOT enabled', async () => {
			await cleanupCollections(em);
			Configuration.set('FEATURE_TASK_CARD_ENABLED', false);
			const user = setupUser([]);
			const course = courseFactory.buildWithId({ teachers: [user] });

			await em.persistAndFlush([user, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const params = {
				title: 'title',
				courseId: course.id,
				dueDate: inThreeDays,
			};
			await request(app.getHttpServer()).post(`/cards/task`).set('Accept', 'application/json').send(params).expect(500);
		});
		it('should throw if courseId is empty', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_CREATE, Permission.HOMEWORK_EDIT]);
			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardParams = {
				title: 'test title',
				cardElements: [],
				courseId: '',
			};
			await request(app.getHttpServer())
				.post(`/cards/task/`)
				.set('Accept', 'application/json')
				.send(taskCardParams)
				.expect(400);
		});
		it('should throw if visible at date is empty', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_CREATE, Permission.HOMEWORK_EDIT]);
			const course = courseFactory.buildWithId({ teachers: [user], untilDate: inThreeDays });

			await em.persistAndFlush([user, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardParams = {
				title: 'test title',
				cardElements: [],
				courseId: course.id,
			};
			await request(app.getHttpServer())
				.post(`/cards/task/`)
				.set('Accept', 'application/json')
				.send(taskCardParams)
				.expect(400);
		});
		it('should throw if no course is matching', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_CREATE, Permission.HOMEWORK_EDIT]);
			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardParams = {
				title: 'test title',
				cardElements: [],
				courseId: new ObjectId().toHexString(),
			};
			await request(app.getHttpServer())
				.post(`/cards/task/`)
				.set('Accept', 'application/json')
				.send(taskCardParams)
				.expect(400);
		});
		it('should throw if dueDate is empty', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_CREATE, Permission.HOMEWORK_EDIT]);
			const course = courseFactory.buildWithId({ teachers: [user] });

			await em.persistAndFlush([user, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardParams = {
				title: 'test title',
				cardElements: [],
				courseId: course.id,
			};

			await request(app.getHttpServer())
				.post(`/cards/task/`)
				.set('Accept', 'application/json')
				.send(taskCardParams)
				.expect(400);
		});
		it('should throw if dueDate is earlier than today', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_CREATE, Permission.HOMEWORK_EDIT]);
			const course = courseFactory.buildWithId({ teachers: [user] });

			await em.persistAndFlush([user, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardParams = {
				title: 'test title',
				cardElements: [],
				courseId: course.id,
				dueDate: new Date(Date.now() - 259200000),
			};

			await request(app.getHttpServer())
				.post(`/cards/task/`)
				.set('Accept', 'application/json')
				.send(taskCardParams)
				.expect(400);
		});
		it('should throw if title is empty', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_CREATE, Permission.HOMEWORK_EDIT]);

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardParams = {
				title: '',
			};

			await request(app.getHttpServer())
				.post(`/cards/task/`)
				.set('Accept', 'application/json')
				.send(taskCardParams)
				.expect(400);
		});
		it('should throw if title is not a string', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_CREATE, Permission.HOMEWORK_EDIT]);

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardParams = {
				title: 1234,
			};

			await request(app.getHttpServer())
				.post(`/cards/task/`)
				.set('Accept', 'application/json')
				.send(taskCardParams)
				.expect(501);
		});
		it('should throw if title is not provided', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_CREATE, Permission.HOMEWORK_EDIT]);

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardParams = {};

			await request(app.getHttpServer())
				.post(`/cards/task/`)
				.set('Accept', 'application/json')
				.send(taskCardParams)
				.expect(400);
		});
		it('should throw if visible at Date is empty', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_CREATE, Permission.HOMEWORK_EDIT]);
			const course = courseFactory.buildWithId({ teachers: [user], untilDate: inThreeDays });

			await em.persistAndFlush([user, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardParams = {
				title: 'test title',
				courseId: course.id,
				dueDate: inTwoDays,
				visibleAtDate: '',
			};
			await request(app.getHttpServer())
				.post(`/cards/task/`)
				.set('Accept', 'application/json')
				.send(taskCardParams)
				.expect(400);
		});
		it('should throw if visible at Date is not a valid date', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_CREATE, Permission.HOMEWORK_EDIT]);
			const course = courseFactory.buildWithId({ teachers: [user], untilDate: inThreeDays });

			await em.persistAndFlush([user, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardParams = {
				title: 'test title',
				courseId: course.id,
				dueDate: inTwoDays,
				visibleAtDate: 'abc',
			};
			await request(app.getHttpServer())
				.post(`/cards/task/`)
				.set('Accept', 'application/json')
				.send(taskCardParams)
				.expect(400);
		});
	});
	describe('[GET] /cards/task/:id', () => {
		it('should return existing task-card', async () => {
			const user = setupUser([Permission.TASK_CARD_VIEW, Permission.HOMEWORK_VIEW]);
			const title = 'title test';
			// for some reason taskCard factory messes up the creator of task, so it needs to be separated
			const task = taskFactory.build({ name: title, creator: user });
			const taskCard = taskCardFactory.buildWithId({ creator: user, task });

			await em.persistAndFlush([user, task, taskCard]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await request(app.getHttpServer())
				.get(`/cards/task/${taskCard.id}`)
				.set('Accept', 'application/json')
				.expect(200);

			const responseTaskCard = response.body as TaskCardResponse;

			expect(responseTaskCard.id).toEqual(taskCard.id);
		});
		it('should throw if feature not enabled', async () => {
			await cleanupCollections(em);
			Configuration.set('FEATURE_TASK_CARD_ENABLED', false);
			const user = setupUser([]);
			const taskCard = taskCardFactory.buildWithId({ creator: user });

			await em.persistAndFlush([user, taskCard]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			await request(app.getHttpServer())
				.get(`/cards/task/${taskCard.id}`)
				.set('Accept', 'application/json')
				.expect(500);
		});
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
			expect(new Date(responseTaskCard.visibleAtDate ? responseTaskCard.visibleAtDate : '')).toEqual(inTwoDays);
			expect(new Date(responseTaskCard.task?.availableDate ? responseTaskCard.task?.availableDate : '')).toEqual(
				inTwoDays
			);
			expect(new Date(responseTaskCard.dueDate)).toEqual(inThreeDays);
		});
		it('should remove visibleAtDate in task card and available date in task ', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_EDIT]);

			const title = 'title test';
			// for some reason taskCard factory messes up the creator of task, so it needs to be separated
			const task = taskFactory.build({ name: title, creator: user, availableDate: tomorrow });
			const taskCard = taskCardFactory.buildWithId({ creator: user, task });
			const course = courseFactory.buildWithId({ teachers: [user], untilDate: inFourDays });

			await em.persistAndFlush([user, task, taskCard, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardUpdateParams = {
				title: 'title test',
				dueDate: inThreeDays,
				courseId: course.id,
			};
			const response = await request(app.getHttpServer())
				.patch(`/cards/task/${taskCard.id}`)
				.set('Accept', 'application/json')
				.send(taskCardUpdateParams)
				.expect(200);

			const responseTaskCard = response.body as TaskCardResponse;

			expect(responseTaskCard.visibleAtDate).toBeUndefined();
			expect(responseTaskCard.task?.availableDate).toBeUndefined();
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
		it('should throw if availableDate is empty', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_EDIT]);
			const title = 'title test';
			const task = taskFactory.build({ name: title, creator: user });
			const taskCard = taskCardFactory.buildWithId({ creator: user, task });
			const course = courseFactory.buildWithId({ teachers: [user], untilDate: inFourDays });

			await em.persistAndFlush([user, task, taskCard, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardUpdateParams = {
				title: 'updated title',

				visibleAtDate: '',
				dueDate: inThreeDays,
				courseId: course.id,
			};
			await request(app.getHttpServer())
				.patch(`/cards/task/${taskCard.id}`)
				.set('Accept', 'application/json')
				.send(taskCardUpdateParams)
				.expect(400);
		});
		it('should throw if availableDate is not a valid date', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_EDIT]);
			const title = 'title test';
			const task = taskFactory.build({ name: title, creator: user });
			const taskCard = taskCardFactory.buildWithId({ creator: user, task });
			const course = courseFactory.buildWithId({ teachers: [user], untilDate: inFourDays });

			await em.persistAndFlush([user, task, taskCard, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardUpdateParams = {
				title: 'updated title',
				visibleAtDate: 'abc',
				dueDate: inThreeDays,
				courseId: course.id,
			};
			await request(app.getHttpServer())
				.patch(`/cards/task/${taskCard.id}`)
				.set('Accept', 'application/json')
				.send(taskCardUpdateParams)
				.expect(400);
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
