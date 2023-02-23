import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ValidationError } from '@shared/common/error';
import { CardType, Course, EntityId, Permission, PermissionContextBuilder, TaskCard, User } from '@shared/domain';
import { CardElement, RichTextCardElement, TitleCardElement } from '@shared/domain/entity/cardElement.entity';
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
		let course: Course | undefined;

		if (!this.authorizationService.hasAllPermissions(user, [Permission.TASK_CARD_EDIT])) {
			throw new UnauthorizedException();
		}

		if (params.courseId) {
			const fetchedCourse = await this.courseRepo.findById(params.courseId);
			this.authorizationService.checkPermission(user, fetchedCourse, PermissionContextBuilder.write([]));
			course = fetchedCourse;
		}

		const defaultDueDate = this.getDefaultDueDate(user);

		const taskWithStatusVo = await this.createTask(userId, params);

		const cardElements: CardElement[] = [];

		const title = new TitleCardElement(params.title);
		cardElements.unshift(title);

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
			dueDate: defaultDueDate,
		};

		if (params.visibleAtDate) {
			cardParams.visibleAtDate = params.visibleAtDate;
		}

		if (params.dueDate) {
			cardParams.dueDate = params.dueDate;
		}

		const card = new TaskCard(cardParams);

		if (!card.isVisibleBeforeDueDate()) {
			throw new ValidationError('Invalid date combination');
		}

		await this.taskCardRepo.save(card);

		await this.addTaskCardId(userId, card);

		return { card, taskWithStatusVo };
	}

	private async createTask(userId: EntityId, params: ITaskCardCRUD) {
		const taskParams = {
			name: params.title,
			courseId: '',
		};
		if (params.courseId) {
			taskParams.courseId = params.courseId;
		}
		const taskWithStatusVo = await this.taskService.create(userId, taskParams);

		return taskWithStatusVo;
	}

	private getDefaultDueDate(user: User) {
		const currentSchoolYear = user.school.schoolYear;
		if (currentSchoolYear) {
			return currentSchoolYear.endDate;
		}
		const lastDayOfNextYear = new Date(new Date().getFullYear() + 1, 11, 31);
		return lastDayOfNextYear;
	}

	async findOne(userId: EntityId, id: EntityId) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const card = await this.taskCardRepo.findById(id);

		if (
			!this.authorizationService.hasPermission(user, card, PermissionContextBuilder.read([Permission.TASK_CARD_VIEW]))
		) {
			throw new UnauthorizedException();
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
			throw new UnauthorizedException();
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
			throw new UnauthorizedException();
		}

		const taskWithStatusVo = await this.updateTaskName(userId, card.task.id, params);

		const cardElements: CardElement[] = [];
		const title = new TitleCardElement(params.title);
		cardElements.unshift(title);

		if (params.text) {
			const texts = params.text.map((text) => new RichTextCardElement(text));
			cardElements.push(...texts);
		}

		if (params.visibleAtDate) {
			card.visibleAtDate = params.visibleAtDate;
		}

		if (params.dueDate) {
			card.dueDate = params.dueDate;
		}

		if (!card.isVisibleBeforeDueDate()) {
			throw new ValidationError('Invalid date combination');
		}

		await this.replaceCardElements(card, cardElements);
		await this.taskCardRepo.save(card);

		return { card, taskWithStatusVo };
	}

	private async updateTaskName(userId: EntityId, id: EntityId, params: ITaskCardCRUD) {
		const taskParams = {
			name: params.title,
		};
		const taskWithStatusVo = await this.taskService.update(userId, id, taskParams);

		return taskWithStatusVo;
	}

	private async replaceCardElements(taskCard: TaskCard, newCardElements: CardElement[]) {
		await this.cardElementRepo.delete(taskCard.cardElements.getItems());
		taskCard.cardElements.set(newCardElements);

		return taskCard;
	}

	private async addTaskCardId(userId: EntityId, taskCard: TaskCard) {
		const taskParams = {
			name: taskCard.task.name,
			taskCard: taskCard.id,
		};
		const taskWithStatusVo = await this.taskService.update(userId, taskCard.task.id, taskParams);

		return taskWithStatusVo;
	}
}
