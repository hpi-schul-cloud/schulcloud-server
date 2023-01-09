import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Actions, CardType, InputFormat, Permission, TaskCard, TaskWithStatusVo, User } from '@shared/domain';
import { RichTextCardElement, TitleCardElement } from '@shared/domain/entity/cardElement.entity';
import { RichText } from '@shared/domain/types/richtext.types';
import { CardElementRepo, RichTextCardElementRepo, TaskCardRepo, TitleCardElementRepo, UserRepo } from '@shared/repo';
import {
	richTextCardElementFactory,
	setupEntities,
	taskCardFactory,
	taskFactory,
	titleCardElementFactory,
	userFactory
} from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import { ITaskCardCreate, ITaskCardUpdate } from '@src/modules/task-card/controller/mapper/task-card.mapper';
import { TaskService } from '@src/modules/task/service';
import { TaskCardUc } from './task-card.uc';
import objectContaining = jasmine.objectContaining;

describe('TaskCardUc', () => {
	let module: TestingModule;
	let uc: TaskCardUc;
	let cardElementRepo: DeepMocked<CardElementRepo>;
	let titleCardElementRepo: DeepMocked<TitleCardElementRepo>;
	let richTextCardElementRepo: DeepMocked<RichTextCardElementRepo>;
	let taskCardRepo: DeepMocked<TaskCardRepo>;
	let userRepo: DeepMocked<UserRepo>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let taskService: DeepMocked<TaskService>;
	let orm: MikroORM;

	let taskCard: TaskCard;
	let user!: User;

	beforeAll(async () => {
		orm = await setupEntities();
		module = await Test.createTestingModule({
			imports: [],
			providers: [
				TaskCardUc,
				{
					provide: TaskCardRepo,
					useValue: createMock<TaskCardRepo>(),
				},
				{
					provide: CardElementRepo,
					useValue: createMock<CardElementRepo>(),
				},
				{
					provide: TitleCardElementRepo,
					useValue: createMock<TitleCardElementRepo>(),
				},
				{
					provide: RichTextCardElementRepo,
					useValue: createMock<RichTextCardElementRepo>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: TaskService,
					useValue: createMock<TaskService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(TaskCardUc);
		cardElementRepo = module.get(CardElementRepo);
		titleCardElementRepo = module.get(TitleCardElementRepo);
		richTextCardElementRepo = module.get(RichTextCardElementRepo);
		taskCardRepo = module.get(TaskCardRepo);
		userRepo = module.get(UserRepo);
		authorizationService = module.get(AuthorizationService);
		taskService = module.get(TaskService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(uc).toBeDefined();
	});

	describe('findOne', () => {
		let taskWithStatus: TaskWithStatusVo;

		beforeEach(() => {
			user = userFactory.buildWithId();
			taskCard = taskCardFactory.buildWithId();

			userRepo.findById.mockResolvedValue(user);
			taskCardRepo.findById.mockResolvedValue(taskCard);
			authorizationService.hasPermission.mockReturnValue(true);
		});
		afterEach(() => {
			userRepo.findById.mockRestore();
			taskCardRepo.findById.mockRestore();
			authorizationService.hasPermission.mockRestore();
		});
		it('should check for permission to view the TaskCard', async () => {
			await uc.findOne(user.id, taskCard.id);
			expect(authorizationService.hasPermission).toBeCalledWith(user, taskCard, {
				action: Actions.read,
				requiredPermissions: [Permission.TASK_CARD_VIEW],
			});
		});
		it('should throw if user has no permission', async () => {
			authorizationService.hasPermission.mockReturnValue(false);
			await expect(async () => {
				await uc.findOne(user.id, taskCard.id);
			}).rejects.toThrow(UnauthorizedException);
		});
		it('should call taskService', async () => {
			await uc.findOne(user.id, taskCard.id);
			expect(taskService.find).toBeCalledWith(user.id, taskCard.task.id);
		});
		it('should return the taskCard and task', async () => {
			const status = taskCard.task.createTeacherStatusForUser(user);
			taskWithStatus = new TaskWithStatusVo(taskCard.task, status);
			taskService.find.mockResolvedValue(taskWithStatus);

			const result = await uc.findOne(user.id, taskCard.id);
			expect(result.card).toEqual(taskCard);
			expect(result.taskWithStatusVo).toEqual(taskWithStatus);
		});
	});

	describe('delete', () => {
		beforeEach(() => {
			user = userFactory.buildWithId();
			taskCard = taskCardFactory.buildWithId();

			userRepo.findById.mockResolvedValue(user);
			taskCardRepo.findById.mockResolvedValue(taskCard);
			authorizationService.hasPermission.mockReturnValue(true);
		});
		afterEach(() => {
			userRepo.findById.mockRestore();
			taskCardRepo.findById.mockRestore();
			authorizationService.hasPermission.mockRestore();
		});
		it('should check for permission to delete (i.e. edit) the TaskCard', async () => {
			await uc.delete(user.id, taskCard.id);
			expect(authorizationService.hasPermission).toBeCalledWith(user, taskCard, {
				action: Actions.write,
				requiredPermissions: [Permission.TASK_CARD_EDIT],
			});
		});
		it('should throw if user has no permission', async () => {
			authorizationService.hasPermission.mockReturnValue(false);
			await expect(async () => {
				await uc.delete(user.id, taskCard.id);
			}).rejects.toThrow(UnauthorizedException);
		});
		it('should delete taskCard', async () => {
			await uc.delete(user.id, taskCard.id);
			expect(taskCardRepo.delete).toBeCalledWith(taskCard);
		});
		it('should return true', async () => {
			const result = await uc.delete(user.id, taskCard.id);
			expect(result).toEqual(true);
		});
	});

	describe('create', () => {
		let taskCardCreateParams: ITaskCardCreate;
		const title = 'text title';
		const richText = ['test richtext 1', 'test richtext 2'];
		beforeEach(() => {
			user = userFactory.buildWithId();
			taskCardCreateParams = {
				title,
				text: [
					new RichText({ content: richText[0], type: InputFormat.RICH_TEXT_CK5 }),
					new RichText({ content: richText[1], type: InputFormat.RICH_TEXT_CK5 }),
				],
			};

			userRepo.findById.mockResolvedValue(user);
			taskCardRepo.findById.mockResolvedValue(taskCard);
			authorizationService.hasAllPermissions.mockReturnValue(true);
		});
		afterEach(() => {
			userRepo.findById.mockRestore();
			taskCardRepo.findById.mockRestore();
			authorizationService.hasAllPermissions.mockRestore();
		});
		it('should check for permission to create (i.e. edit) the TaskCard', async () => {
			await uc.create(user.id, taskCardCreateParams);
			expect(authorizationService.hasAllPermissions).toBeCalledWith(user, [Permission.TASK_CARD_EDIT]);
		});
		it('should throw if user has no permission', async () => {
			authorizationService.hasAllPermissions.mockReturnValue(false);
			await expect(async () => {
				await uc.create(user.id, taskCardCreateParams);
			}).rejects.toThrow(UnauthorizedException);
		});
		it('should call task create and with task name same like task-card title', async () => {
			const taskParams = { name: taskCardCreateParams.title };
			await uc.create(user.id, taskCardCreateParams);
			expect(taskService.create).toBeCalledWith(user.id, taskParams);
		});
		it('should create task-card', async () => {
			await uc.create(user.id, taskCardCreateParams);
			const task = taskFactory.build({ name: taskCardCreateParams.title });

			expect(taskCardRepo.save).toBeCalledWith(
				expect.objectContaining({
					cardType: CardType.Task,
					draggable: true,
					creator: user,
					// cardElements
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					// task: expect.objectContaining({ name: task.name }),
				})
			);
		});
		it('should return the task card and task', async () => {
			const result = await uc.create(user.id, taskCardCreateParams);
			expect(result.card.task).toEqual(result.taskWithStatusVo.task);
			expect(result.card.cardType).toEqual(CardType.Task);

			expect(result.card.cardElements.length).toEqual(3);
			expect((result.card.cardElements.getItems()[0] as TitleCardElement).value).toEqual(title);
			expect((result.card.cardElements.getItems()[1] as RichTextCardElement).value).toEqual(richText[0]);
			expect((result.card.cardElements.getItems()[2] as RichTextCardElement).value).toEqual(richText[1]);

			// expect(result.card.creator.id).toEqual(user.id);
		});
	});

	describe('update', () => {
		let taskWithStatus: TaskWithStatusVo;
		let taskCardUpdateParams: ITaskCardUpdate;
		const title = 'changed text title';
		const richText = ['changed richtext 1', 'changed richtext 2'];
		beforeEach(() => {
			user = userFactory.buildWithId();

			const titleCardElement = titleCardElementFactory.build();
			const richTextCardElements = richTextCardElementFactory.buildList(2);
			taskCard = taskCardFactory.buildWithId({ cardElements: [titleCardElement, ...richTextCardElements] });

			const status = taskCard.task.createTeacherStatusForUser(user);
			const taskWithStatusVo = new TaskWithStatusVo(taskCard.task, status);
			taskService.update.mockResolvedValue(taskWithStatusVo);

			taskCardUpdateParams = {
				id: taskCard.id,
				title,
				text: [
					new RichText({ content: richText[0], type: InputFormat.RICH_TEXT_CK5 }),
					new RichText({ content: richText[1], type: InputFormat.RICH_TEXT_CK5 }),
				],
			};

			userRepo.findById.mockResolvedValue(user);
			taskCardRepo.findById.mockResolvedValue(taskCard);
			authorizationService.hasPermission.mockReturnValue(true);
		});
		afterEach(() => {
			userRepo.findById.mockRestore();
			taskCardRepo.findById.mockRestore();
			authorizationService.hasPermission.mockRestore();
			taskService.update.mockRestore();
		});
		it('should check for permission to edit the TaskCard', async () => {
			await uc.update(user.id, taskCard.id, taskCardUpdateParams);
			expect(authorizationService.hasPermission).toBeCalledWith(user, taskCard, {
				action: Actions.write,
				requiredPermissions: [Permission.TASK_CARD_EDIT],
			});
		});
		it('should throw if user has no permission', async () => {
			authorizationService.hasPermission.mockReturnValue(false);
			await expect(async () => {
				await uc.update(user.id, taskCard.id, taskCardUpdateParams);
			}).rejects.toThrow(UnauthorizedException);
		});
		it('should call task update and with task name same like task-card title', async () => {
			const taskParams = { name: taskCardUpdateParams.title };
			await uc.update(user.id, taskCard.id, taskCardUpdateParams);
			expect(taskService.update).toBeCalledWith(user.id, taskCard.task.id, taskParams);
		});
		it('should delete existing card elements and set the new elements', async () => {
			const originalCardElements = taskCard.cardElements.getItems();
			await uc.update(user.id, taskCard.id, taskCardUpdateParams);
			const newTitleCardElement = titleCardElementFactory.build(title);
			/* const newRichTextCardElementOne = richTextCardElementFactory.build(
				new RichText({ content: richText[0], type: InputFormat.RICH_TEXT_CK5 })
			);
			const newRichTextCardElementTwo = richTextCardElementFactory.build(
				new RichText({ content: richText[1], type: InputFormat.RICH_TEXT_CK5 })
			); */

			expect(cardElementRepo.delete).toBeCalledWith(originalCardElements);
			// expect(taskCard.cardElements.set).toBeCalledWith(newTitleCardElement);
		});
		it('should return the task card and task', async () => {
			const result = await uc.update(user.id, taskCard.id, taskCardUpdateParams);

			expect(result.card.task.id).toEqual(result.taskWithStatusVo.task.id);
			// expect(result.card.task.name).toEqual(title);
			expect(result.card.cardType).toEqual(CardType.Task);

			expect(result.card.cardElements.length).toEqual(3);
			expect((result.card.cardElements.getItems()[0] as TitleCardElement).value).toEqual(title);
			expect((result.card.cardElements.getItems()[1] as RichTextCardElement).value).toEqual(richText[0]);
			expect((result.card.cardElements.getItems()[2] as RichTextCardElement).value).toEqual(richText[1]);

			// expect(result.card.creator.id).toEqual(user.id);
		});
	});
});
