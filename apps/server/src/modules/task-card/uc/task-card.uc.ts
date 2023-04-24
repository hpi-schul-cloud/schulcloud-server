import { ForbiddenException, Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common/error';
import { CardType, Course, EntityId, Permission, PermissionContextBuilder, TaskCard, User } from '@shared/domain';
import { CardElement, RichTextCardElement } from '@shared/domain/entity/card-element.entity';
import { ITaskCardProps } from '@shared/domain/entity/task-card.entity';
import { CardElementRepo, CourseRepo, TaskCardRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { TaskService } from '@src/modules/task/service';
import { ITaskCardCRUD } from '../interface';

@Injectable()
export class TaskCardUc {
	constructor(
		private taskCardRepo: TaskCardRepo,
		private cardElementRepo: CardElementRepo,
		private readonly authorizationService: AuthorizationService,
		private readonly courseRepo: CourseRepo,
		private readonly taskService: TaskService
	) {}

	async create(userId: EntityId, params: ITaskCardCRUD) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		if (!this.authorizationService.hasAllPermissions(user, [Permission.TASK_CARD_EDIT])) {
			throw new ForbiddenException();
		}

		const course = await this.courseRepo.findById(params.courseId);
		this.authorizationService.checkPermission(user, course, PermissionContextBuilder.write([]));

		this.validateDueDate({ params, course, user });

		const taskWithStatusVo = await this.createTask(userId, params);

		const cardElements: CardElement[] = [];

		if (params.text) {
			const texts = params.text.map((text) => new RichTextCardElement(text));
			cardElements.push(...texts);
		}

		const cardParams: ITaskCardProps = {
			cardElements,
			cardType: CardType.Task,
			course,
			creator: user,
			draggable: true,
			task: taskWithStatusVo.task,
			visibleAtDate: new Date(),
			dueDate: params.dueDate,
			title: params.title,
		};

		if (params.visibleAtDate) {
			cardParams.visibleAtDate = params.visibleAtDate;
		}

		const card = new TaskCard(cardParams);

		await this.taskCardRepo.save(card);

		await this.addTaskCardId(userId, card);

		return { card, taskWithStatusVo };
	}

	async findOne(userId: EntityId, id: EntityId) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const card = await this.taskCardRepo.findById(id);

		if (
			!this.authorizationService.hasPermission(user, card, PermissionContextBuilder.read([Permission.TASK_CARD_VIEW]))
		) {
			throw new ForbiddenException();
		}

		const taskWithStatusVo = await this.taskService.find(userId, card.task.id);

		return { card, taskWithStatusVo };
	}

	async delete(userId: EntityId, id: EntityId) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const card = await this.taskCardRepo.findById(id);

		if (
			!this.authorizationService.hasPermission(user, card, PermissionContextBuilder.write([Permission.TASK_CARD_EDIT]))
		) {
			throw new ForbiddenException();
		}

		await this.taskCardRepo.delete(card);

		return true;
	}

	async update(userId: EntityId, id: EntityId, params: ITaskCardCRUD) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const card = await this.taskCardRepo.findById(id);

		if (
			!this.authorizationService.hasPermission(user, card, PermissionContextBuilder.write([Permission.TASK_CARD_EDIT]))
		) {
			throw new ForbiddenException();
		}

		const course = await this.courseRepo.findById(params.courseId);
		this.authorizationService.checkPermission(user, course, PermissionContextBuilder.write([]));

		this.validateDueDate({ params, course, user });

		const taskWithStatusVo = await this.updateTask(userId, card.task.id, params);

		const cardElements: CardElement[] = [];
		card.title = params.title;
		card.course = course;
		card.dueDate = params.dueDate;

		if (params.text) {
			const texts = params.text.map((text) => new RichTextCardElement(text));
			cardElements.push(...texts);
		}

		if (params.visibleAtDate) {
			card.visibleAtDate = params.visibleAtDate;
		}

		await this.replaceCardElements(card, cardElements);
		await this.taskCardRepo.save(card);

		return { card, taskWithStatusVo };
	}

	private async createTask(userId: EntityId, params: ITaskCardCRUD) {
		const taskParams = {
			name: params.title,
			courseId: params.courseId,
			dueDate: params.dueDate,
			availableDate: new Date(),
			private: false,
		};

		if (params.visibleAtDate) {
			taskParams.availableDate = params.visibleAtDate;
		}

		const taskWithStatusVo = await this.taskService.create(userId, taskParams);

		return taskWithStatusVo;
	}

	private async addTaskCardId(userId: EntityId, taskCard: TaskCard) {
		const taskParams = {
			name: taskCard.task.name,
			taskCard: taskCard.id,
		};
		const taskWithStatusVo = await this.taskService.update(userId, taskCard.task.id, taskParams);

		return taskWithStatusVo;
	}

	private async updateTask(userId: EntityId, id: EntityId, params: ITaskCardCRUD) {
		const taskParams = {
			name: params.title,
			courseId: params.courseId,
			dueDate: params.dueDate,
		};
		const taskWithStatusVo = await this.taskService.update(userId, id, taskParams);

		return taskWithStatusVo;
	}

	private async replaceCardElements(taskCard: TaskCard, newCardElements: CardElement[]) {
		await this.cardElementRepo.delete(taskCard.cardElements.getItems());
		taskCard.cardElements.set(newCardElements);

		return taskCard;
	}

	private validateDueDate(validationObject: { params: ITaskCardCRUD; course: Course; user: User }) {
		const { params, course, user } = validationObject;
		if (course.untilDate) {
			this.checkCourseEndDate(course.untilDate, params.dueDate);
		} else if (user.school.schoolYear?.endDate) {
			this.checkSchoolYearEndDate(user.school.schoolYear.endDate, params.dueDate);
		} else {
			this.checkNextYearEndDate(params.dueDate);
		}
		if (params.visibleAtDate && params.visibleAtDate > params.dueDate) {
			throw new ValidationError('Visible at date must be before due date');
		}
	}

	private checkSchoolYearEndDate(schoolYearEndDate: Date, dueDate: Date) {
		if (this.isFirstDateEarlierThanSecondDate(schoolYearEndDate, dueDate)) {
			throw new ValidationError('Due date must be before school year end date');
		}
	}

	private checkCourseEndDate(courseEndDate: Date, dueDate: Date) {
		if (this.isFirstDateEarlierThanSecondDate(courseEndDate, dueDate)) {
			throw new ValidationError('Due date must be before course end date');
		}
	}

	private checkNextYearEndDate(dueDate: Date) {
		const lastDayOfNextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
		if (this.isFirstDateEarlierThanSecondDate(lastDayOfNextYear, dueDate)) {
			throw new ValidationError('Due date must be before end of next year');
		}
	}

	private isFirstDateEarlierThanSecondDate(dateToCompare: Date, referenceDate: Date): boolean {
		const firstDate = new Date(dateToCompare);
		const secondDate = new Date(referenceDate);
		return secondDate.setHours(0, 0, 0, 0) > firstDate.setHours(0, 0, 0, 0);
	}
}
