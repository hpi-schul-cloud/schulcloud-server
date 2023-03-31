import { ForbiddenException, Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common/error';
import { CardType, EntityId, Permission, PermissionContextBuilder, TaskCard } from '@shared/domain';
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
		const course = await this.courseRepo.findById(params.courseId);
		this.authorizationService.checkPermission(user, course, PermissionContextBuilder.write([]));

		if (!this.authorizationService.hasAllPermissions(user, [Permission.TASK_CARD_EDIT])) {
			throw new ForbiddenException();
		}

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

		if (!card.isVisibleBeforeDueDate()) {
			throw new ValidationError('Invalid date combination');
		}

		if (!course.untilDate) {
			throw new ValidationError('Course end date is not set');
		} else if (course.untilDate && course.untilDate < cardParams.dueDate) {
			throw new ValidationError('Due date must be before course end date');
		}

		await this.taskCardRepo.save(card);

		await this.addTaskCardId(userId, card);

		return { card, taskWithStatusVo };
	}

	private async createTask(userId: EntityId, params: ITaskCardCRUD) {
		const taskParams = {
			name: params.title,
			courseId: '',
			private: false,
		};
		if (params.courseId) {
			taskParams.courseId = params.courseId;
		}
		const taskWithStatusVo = await this.taskService.create(userId, taskParams);

		return taskWithStatusVo;
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

		const taskWithStatusVo = await this.updateTaskName(userId, card.task.id, params);

		const cardElements: CardElement[] = [];
		if (params.title) {
			card.title = params.title;
		}

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
