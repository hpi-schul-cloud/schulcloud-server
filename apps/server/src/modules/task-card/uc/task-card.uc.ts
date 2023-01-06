import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CardType, EntityId, Permission, PermissionContextBuilder, TaskCard } from '@shared/domain';
import { CardElement, RichTextCardElement, TitleCardElement } from '@shared/domain/entity/cardElement.entity';
import { CardElementRepo, RichTextCardElementRepo, TaskCardRepo, TitleCardElementRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { TaskService } from '@src/modules/task/service';
import { ITaskCardProps } from '@shared/domain/entity/task-card.entity';
import { ITaskCardCreate, ITaskCardUpdate } from '../controller/mapper/task-card.mapper';

@Injectable()
export class TaskCardUc {
	constructor(
		private taskCardRepo: TaskCardRepo,
		private cardElementRepo: CardElementRepo,
		private titleCardElementRepo: TitleCardElementRepo,
		private richTextCardElementRepo: RichTextCardElementRepo,
		private readonly authorizationService: AuthorizationService,
		private readonly taskService: TaskService
	) {}

	async create(userId: EntityId, params: ITaskCardCreate) {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		if (!this.authorizationService.hasAllPermissions(user, [Permission.TASK_CARD_EDIT])) {
			throw new UnauthorizedException();
		}

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
			creator: user,
			draggable: true,
			task: taskWithStatusVo.task,
		};
		const card = new TaskCard(cardParams);

		await this.taskCardRepo.save(card);

		return { card, taskWithStatusVo };
	}

	private async createTask(userId: EntityId, params: ITaskCardCreate) {
		const taskParams = {
			name: params.title,
		};
		const taskWithStatusVo = await this.taskService.create(userId, taskParams);

		return taskWithStatusVo;
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

	async update(userId: EntityId, id: EntityId, params: ITaskCardUpdate) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const card = await this.taskCardRepo.findById(id);

		if (
			!this.authorizationService.hasPermission(user, card, PermissionContextBuilder.write([Permission.TASK_CARD_EDIT]))
		) {
			throw new UnauthorizedException();
		}

		const taskWithStatusVo = await this.updateTask(userId, card.task.id, params);

		const cardElements: CardElement[] = [];
		const title = new TitleCardElement(params.title);
		cardElements.unshift(title);

		if (params.text) {
			const texts = params.text.map((text) => new RichTextCardElement(text));
			cardElements.push(...texts);
		}

		await this.cardElementRepo.delete(card.cardElements.getItems());
		card.cardElements.set(cardElements);
		await this.taskCardRepo.save(card);

		return { card, taskWithStatusVo };
	}

	private async updateTask(userId: EntityId, id: EntityId, params: ITaskCardUpdate) {
		const taskParams = {
			name: params.title,
		};
		const taskWithStatusVo = await this.taskService.update(userId, id, taskParams);

		return taskWithStatusVo;
	}
}
