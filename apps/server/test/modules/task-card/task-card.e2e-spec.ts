import { Configuration } from '@hpi-schul-cloud/commons';
import { Test, TestingModule } from '@nestjs/testing';

import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { sanitizeRichText } from '@shared/controller';
import {
	CardElementType,
	CardRichTextElementResponse,
	CardTitleElementResponse,
	ICurrentUser,
	InputFormat,
	Permission,
	Task,
	TaskCard,
} from '@shared/domain';
import {
	cleanupCollections,
	mapUserToCurrentUser,
	richTextCardElementFactory,
	roleFactory,
	taskCardFactory,
	taskFactory,
	titleCardElementFactory,
	userFactory,
} from '@shared/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { TaskCardResponse } from '@src/modules/task-card/controller/dto';
import { Request } from 'express';
import request from 'supertest';

describe('Task-Card Controller (2e2)', () => {
	let app: INestApplication;
	let em: EntityManager;
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

	describe('When feature is not enabled', () => {
		beforeEach(async () => {
			await cleanupCollections(em);
			Configuration.set('FEATURE_TASK_CARD_ENABLED', false);
		});

		it('Create task-card should throw', async () => {
			const user = setupUser([]);

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const params = {
				title: 'title test',
			};
			await request(app.getHttpServer()).post(`/cards/task`).set('Accept', 'application/json').send(params).expect(500);
		});

		it('Find task-card should throw', async () => {
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

		it('Delete task-card should throw', async () => {
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

		it('Update task-card should throw', async () => {
			const user = setupUser([]);

			const taskCard = taskCardFactory.build({ creator: user });

			await em.persistAndFlush([user, taskCard]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const params = {
				cardElements: [
					{
						content: {
							type: 'title',
							value: 'title updated',
						},
					},
				],
			};
			await request(app.getHttpServer())
				.patch(`/cards/task/${taskCard.id}`)
				.set('Accept', 'application/json')
				.send(params)
				.expect(500);
		});
	});

	describe('when feature is enabled', () => {
		it('GET :id should return existing task-card', async () => {
			const user = setupUser([Permission.TASK_CARD_VIEW, Permission.HOMEWORK_VIEW]);
			const title = 'title test';
			const titleCardElement = titleCardElementFactory.build(title);
			// for some reason taskCard factory messes up the creator of task, so it needs to be separated
			const task = taskFactory.build({ name: title, creator: user });
			const taskCard = taskCardFactory.buildWithId({ creator: user, cardElements: [titleCardElement], task });

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
		it('POST should return new task-card', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_CREATE]);

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardCreateParams = {
				title: 'title test',
				text: ['rich text 1', 'rich text 2'],
			};
			const response = await request(app.getHttpServer())
				.post(`/cards/task/`)
				.set('Accept', 'application/json')
				.send(taskCardCreateParams)
				.expect(201);

			const responseTaskCard = response.body as TaskCardResponse;

			expect(responseTaskCard.cardElements.length).toEqual(3);
			expect(responseTaskCard.task.name).toEqual('title test');
		});
		it('DELETE should remove task and task-card', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_EDIT]);
			// for some reason taskCard factory messes up the creator of task, so it needs to be separated
			const task = taskFactory.build({ creator: user });
			const taskCard = taskCardFactory.build({ creator: user, task });

			await em.persistAndFlush([user, task, taskCard]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			await request(app.getHttpServer())
				.delete(`/cards/task/${taskCard.id}`)
				.set('Accept', 'application/json')
				.expect(200);

			const foundTask = await em.findOne(Task, { id: taskCard.task.id });
			expect(foundTask).toEqual(null);

			const foundTaskCard = await em.findOne(TaskCard, { id: taskCard.id });
			expect(foundTaskCard).toEqual(null);
		});
		it('PATCH should update the task card', async () => {
			const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_EDIT]);
			const title = 'title test';
			const titleCardElement = titleCardElementFactory.buildWithId(title);
			const richTextCardElement = richTextCardElementFactory.buildWithId();
			// for some reason taskCard factory messes up the creator of task, so it needs to be separated
			const task = taskFactory.build({ name: title, creator: user });
			const taskCard = taskCardFactory.buildWithId({ creator: user, cardElements: [titleCardElement], task });

			await em.persistAndFlush([user, task, taskCard]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const taskCardUpdateParams = {
				cardElements: [
					{
						id: titleCardElement.id,
						content: {
							type: 'title',
							value: 'title updated',
						},
					},
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
			};
			const response = await request(app.getHttpServer())
				.patch(`/cards/task/${taskCard.id}`)
				.set('Accept', 'application/json')
				.send(taskCardUpdateParams)
				.expect(200);

			const responseTaskCard = response.body as TaskCardResponse;
			const responseTitle = responseTaskCard.cardElements.filter(
				(element) => element.cardElementType === CardElementType.Title
			);
			expect(responseTaskCard.id).toEqual(taskCard.id);
			expect(responseTaskCard.cardElements.length).toEqual(3);
			expect((responseTitle[0].content as CardTitleElementResponse).value).toEqual('title updated');
		});

		describe('Sanitize richtext', () => {
			it('should sanitize richtext on create with inputformat ck5', async () => {
				const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_CREATE]);

				await em.persistAndFlush([user]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);

				const text = '<iframe>rich text 1</iframe> some more text';
				const taskCardCreateParams = {
					title: 'title test',
					text: [text],
				};

				const sanitizedText = sanitizeRichText(text, InputFormat.RICH_TEXT_CK5);

				const response = await request(app.getHttpServer())
					.post(`/cards/task/`)
					.set('Accept', 'application/json')
					.send(taskCardCreateParams)
					.expect(201);

				const responseTaskCard = response.body as TaskCardResponse;
				const richTextElement = responseTaskCard.cardElements.filter(
					(element) => element.cardElementType === CardElementType.RichText
				);
				expect((richTextElement[0].content as CardRichTextElementResponse).value).toEqual(sanitizedText);
			});

			it('should sanitize richtext on update, with given format', async () => {
				const user = setupUser([Permission.TASK_CARD_EDIT, Permission.HOMEWORK_EDIT]);
				// for some reason taskCard factory messes up the creator of task, so it needs to be separated
				const task = taskFactory.build({ creator: user });
				const taskCard = taskCardFactory.buildWithId({ creator: user, task });

				await em.persistAndFlush([user, task, taskCard]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);

				const text = '<iframe>rich text 1</iframe> some more text';
				const sanitizedText = sanitizeRichText(text, InputFormat.RICH_TEXT_CK5);

				const taskCardUpdateParams = {
					cardElements: [
						{
							content: {
								type: 'title',
								value: 'title updated',
							},
						},
						{
							content: {
								type: 'richText',
								value: text,
								inputFormat: InputFormat.RICH_TEXT_CK5,
							},
						},
					],
				};

				const response = await request(app.getHttpServer())
					.patch(`/cards/task/${taskCard.id}`)
					.set('Accept', 'application/json')
					.send(taskCardUpdateParams)
					.expect(200);

				const responseTaskCard = response.body as TaskCardResponse;
				const richTextElement = responseTaskCard.cardElements.filter(
					(element) => element.cardElementType === CardElementType.RichText
				);
				expect((richTextElement[0].content as CardRichTextElementResponse).value).toEqual(sanitizedText);
			});
		});
	});
});
