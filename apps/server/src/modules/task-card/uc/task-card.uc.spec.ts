import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common/error';
import { Actions, CardType, Course, InputFormat, Permission, TaskCard, TaskWithStatusVo, User } from '@shared/domain';
import { CardElementType, RichTextCardElement } from '@shared/domain/entity/card-element.entity';
import { RichText } from '@shared/domain/types/richtext.types';
import { CardElementRepo, CourseRepo, RichTextCardElementRepo, TaskCardRepo, UserRepo } from '@shared/repo';
import {
	courseFactory,
	richTextCardElementFactory,
	schoolFactory,
	setupEntities,
	taskCardFactory,
	userFactory,
} from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import { TaskService } from '@src/modules/task/service';
import { ITaskCardCRUD } from '../interface';
import { TaskCardUc } from './task-card.uc';

describe('TaskCardUc', () => {
	let module: TestingModule;
	let uc: TaskCardUc;
	let cardElementRepo: DeepMocked<CardElementRepo>;
	let courseRepo: DeepMocked<CourseRepo>;
	let taskCardRepo: DeepMocked<TaskCardRepo>;
	let userRepo: DeepMocked<UserRepo>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let taskService: DeepMocked<TaskService>;
	let taskCard: TaskCard;
	let user!: User;
	let course: Course;

	beforeAll(async () => {
		await setupEntities();
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2023-01-23T09:34:54.854Z'));

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
					provide: RichTextCardElementRepo,
					useValue: createMock<RichTextCardElementRepo>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
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
		courseRepo = module.get(CourseRepo);
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
			}).rejects.toThrow(ForbiddenException);
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
			}).rejects.toThrow(ForbiddenException);
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
		let taskCardCreateParams: ITaskCardCRUD;
		const title = 'text title';
		const richText = ['test richtext 1', 'test richtext 2'];
		const tomorrow = new Date(Date.now() + 86400000);
		const inTwoDays = new Date(Date.now() + 172800000);
		const inThreeDays = new Date(Date.now() + 259200000);
		const visibleAtDate = tomorrow;
		const dueDate = inTwoDays;
		beforeEach(() => {
			user = userFactory.buildWithId();
			course = courseFactory.buildWithId({ untilDate: inThreeDays });
			taskCardCreateParams = {
				title,
				text: [
					new RichText({ content: richText[0], type: InputFormat.RICH_TEXT_CK5 }),
					new RichText({ content: richText[1], type: InputFormat.RICH_TEXT_CK5 }),
				],
				courseId: course.id,
				visibleAtDate,
				dueDate,
			};

			userRepo.findById.mockResolvedValue(user);
			courseRepo.findById.mockResolvedValue(course);
			taskCardRepo.findById.mockResolvedValue(taskCard);
			authorizationService.hasAllPermissions.mockReturnValue(true);
		});
		afterEach(() => {
			userRepo.findById.mockRestore();
			courseRepo.findById.mockRestore();
			taskCardRepo.findById.mockRestore();
			authorizationService.hasAllPermissions.mockRestore();
			taskService.update.mockRestore();
		});
		it('should check for permission to create (i.e. edit) the TaskCard', async () => {
			await uc.create(user.id, taskCardCreateParams);
			expect(authorizationService.hasAllPermissions).toBeCalledWith(user, [Permission.TASK_CARD_EDIT]);
		});
		it('should throw if user has no permission', async () => {
			authorizationService.hasAllPermissions.mockReturnValue(false);
			await expect(async () => {
				await uc.create(user.id, taskCardCreateParams);
			}).rejects.toThrow(ForbiddenException);
		});
		it('should fetch course if courseId is given', async () => {
			const expectedCourseParams = taskCardCreateParams.courseId;
			await uc.create(user.id, taskCardCreateParams);
			expect(courseRepo.findById).toBeCalledWith(expectedCourseParams);
		});
		it('should check for course permission to create the task related to the task card in a course', async () => {
			await uc.create(user.id, taskCardCreateParams);
			expect(authorizationService.checkPermission).toBeCalledWith(user, course, {
				action: Actions.write,
				requiredPermissions: [],
			});
		});
		it('should call task create with task name same like task-card title, courseId if given and private as false', async () => {
			const taskParams = { name: taskCardCreateParams.title, courseId: taskCardCreateParams.courseId, private: false };
			await uc.create(user.id, taskCardCreateParams);

			expect(taskService.create).toBeCalledWith(user.id, taskParams);
		});
		it('should throw if due date is before visible at date', async () => {
			const failingTaskCardCreateParams = {
				title,
				text: [
					new RichText({ content: richText[0], type: InputFormat.RICH_TEXT_CK5 }),
					new RichText({ content: richText[1], type: InputFormat.RICH_TEXT_CK5 }),
				],
				visibleAtDate: inTwoDays,
				dueDate: tomorrow,
				courseId: course.id,
			};
			await expect(async () => {
				await uc.create(user.id, failingTaskCardCreateParams);
			}).rejects.toThrow(ValidationError);
		});
		it('should throw if course end is before due date', async () => {
			// TODO: SHOULD FAIL
			const inFourDays = new Date(Date.now() + 345600000);
			const TaskCardCreateParams = {
				title,
				visibleAtDate: new Date(Date.now()),
				dueDate: inTwoDays,
				courseId: course.id,
			};
			await expect(async () => {
				await uc.create(user.id, TaskCardCreateParams);
			}).rejects.toThrow(ValidationError);
		});
		it('should create task-card', async () => {
			await uc.create(user.id, taskCardCreateParams);

			expect(taskCardRepo.save).toBeCalledWith(
				expect.objectContaining({
					cardType: CardType.Task,
					draggable: true,
					creator: user,
				})
			);
		});
		it('should call task update to add id of task-card to task', async () => {
			await uc.create(user.id, taskCardCreateParams);

			expect(taskService.update).toBeCalled();
		});
		it('should return the task card and task', async () => {
			const result = await uc.create(user.id, taskCardCreateParams);
			expect(result.card.task).toEqual(result.taskWithStatusVo.task);
			expect(result.card.cardType).toEqual(CardType.Task);
			expect(result.card.course?.id).toEqual(taskCardCreateParams.courseId);
			expect(result.card.visibleAtDate).toEqual(tomorrow);
			expect(result.card.dueDate).toEqual(inTwoDays);

			expect(result.card.cardElements.length).toEqual(2);
			expect((result.card.cardElements.getItems()[0] as RichTextCardElement).value).toEqual(richText[0]);
			expect((result.card.cardElements.getItems()[1] as RichTextCardElement).value).toEqual(richText[1]);
		});
		it('should return the task card and task without course if no courseId is given', async () => {
			const taskCardCreateParamsWithoutCourse = {
				title,
				text: [
					new RichText({ content: richText[0], type: InputFormat.RICH_TEXT_CK5 }),
					new RichText({ content: richText[1], type: InputFormat.RICH_TEXT_CK5 }),
				],
				visibleAtDate,
				dueDate,
				courseId: '',
			};
			const result = await uc.create(user.id, taskCardCreateParamsWithoutCourse);
			expect(result.card.task.course).not.toBeDefined();
			expect(result.taskWithStatusVo.task.course).not.toBeDefined();
		});
		it('should return the task card with default visible at date if params are not given and creator does NOT provide current school year', async () => {
			const taskCardCreateDefaultParams = {
				title,
				text: [
					new RichText({ content: richText[0], type: InputFormat.RICH_TEXT_CK5 }),
					new RichText({ content: richText[1], type: InputFormat.RICH_TEXT_CK5 }),
				],
				courseId: course.id,
				dueDate: tomorrow,
			};
			const result = await uc.create(user.id, taskCardCreateDefaultParams);
			const expectedVisibleAtDate = new Date();
			expect(result.card.visibleAtDate).toEqual(expectedVisibleAtDate);
		});
		it('should return the task card with default visible at date  if params are not given and creator does provide current school year', async () => {
			const school = schoolFactory.buildWithId();
			const userWithSchool = userFactory.buildWithId({ school });
			authorizationService.getUserWithPermissions.mockResolvedValue(userWithSchool);
			const taskCardCreateDefaultParams = {
				title,
				text: [
					new RichText({ content: richText[0], type: InputFormat.RICH_TEXT_CK5 }),
					new RichText({ content: richText[1], type: InputFormat.RICH_TEXT_CK5 }),
				],
				courseId: course.id,
				dueDate: tomorrow,
			};
			const result = await uc.create(userWithSchool.id, taskCardCreateDefaultParams);
			const expectedVisibleAtDate = new Date();
			expect(result.card.visibleAtDate).toEqual(expectedVisibleAtDate);
		});
	});

	describe('update', () => {
		let taskCardUpdateParams: ITaskCardCRUD;
		const title = 'changed text title';
		const richText = ['changed richtext 1', 'changed richtext 2'];
		const tomorrow = new Date(Date.now() + 86400000);
		const inTwoDays = new Date(Date.now() + 172800000);
		const inThreeDays = new Date(Date.now() + 259200000);
		const visibleAtDate = tomorrow;
		const dueDate = inTwoDays;
		beforeEach(() => {
			user = userFactory.buildWithId();

			const originalRichTextCardElements = richTextCardElementFactory.buildList(2);
			taskCard = taskCardFactory.buildWithId({
				visibleAtDate,
				dueDate,
				cardElements: [...originalRichTextCardElements],
			});

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
				visibleAtDate: inTwoDays,
				dueDate: inThreeDays,
				courseId: course.id,
			};

			userRepo.findById.mockResolvedValue(user);
			taskCardRepo.findById.mockResolvedValue(taskCard);
			authorizationService.hasPermission.mockReturnValue(true);
			authorizationService.getUserWithPermissions.mockResolvedValue(user);
		});
		afterEach(() => {
			userRepo.findById.mockRestore();
			taskCardRepo.findById.mockRestore();
			authorizationService.hasPermission.mockRestore();
			authorizationService.getUserWithPermissions.mockRestore();
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
			}).rejects.toThrow(ForbiddenException);
		});
		it('should call task update and with task name same like task-card title', async () => {
			const taskParams = { name: taskCardUpdateParams.title };
			await uc.update(user.id, taskCard.id, taskCardUpdateParams);
			expect(taskService.update).toBeCalledWith(user.id, taskCard.task.id, taskParams);
		});
		it('should throw if due date is before visible at date', async () => {
			const failingTaskCardUpdateParams = {
				id: taskCard.id,
				title,
				text: [
					new RichText({ content: richText[0], type: InputFormat.RICH_TEXT_CK5 }),
					new RichText({ content: richText[1], type: InputFormat.RICH_TEXT_CK5 }),
				],
				visibleAtDate: inThreeDays,
				dueDate: inTwoDays,
				courseId: taskCard.course.id,
			};
			await expect(async () => {
				await uc.update(user.id, taskCard.id, failingTaskCardUpdateParams);
			}).rejects.toThrow(ValidationError);
		});
		it('should delete existing card elements and set the new elements', async () => {
			const originalCardElements = taskCard.cardElements.getItems();
			const result = await uc.update(user.id, taskCard.id, taskCardUpdateParams);
			expect(cardElementRepo.delete).toBeCalledWith(originalCardElements);

			const updatedCardElements = result.card.cardElements.getItems();
			expect(updatedCardElements).toHaveLength(2);

			const richTextCardElements = updatedCardElements.filter(
				(element) => element.cardElementType === CardElementType.RichText
			) as RichTextCardElement[];
			expect(richTextCardElements).toHaveLength(2);
			expect(richTextCardElements[0].value).toEqual(richText[0]);
			expect(richTextCardElements[1].value).toEqual(richText[1]);
		});
		it('should return the task card and task', async () => {
			const result = await uc.update(user.id, taskCard.id, taskCardUpdateParams);

			expect(result.card.task.id).toEqual(result.taskWithStatusVo.task.id);
			expect(result.card.cardType).toEqual(CardType.Task);
			expect(result.card.visibleAtDate).toEqual(inTwoDays);
			expect(result.card.dueDate).toEqual(inThreeDays);

			expect(result.card.cardElements.length).toEqual(2);
			expect((result.card.cardElements.getItems()[0] as RichTextCardElement).value).toEqual(richText[0]);
			expect((result.card.cardElements.getItems()[1] as RichTextCardElement).value).toEqual(richText[1]);
		});
	});
});
