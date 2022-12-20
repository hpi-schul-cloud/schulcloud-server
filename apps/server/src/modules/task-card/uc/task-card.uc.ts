import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
	CardType,
	EntityId,
	ITaskCardCreate,
	ITaskCardProps,
	Permission,
	PermissionContextBuilder,
	TaskCard,
} from '@shared/domain';
import { CardElement, RichTextCardElement, TitleCardElement } from '@shared/domain/entity/cardElement.entity';
import { TaskCardRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { TaskService } from '@src/modules/task/service';

@Injectable()
export class TaskCardUc {
	constructor(
		private taskCardRepo: TaskCardRepo,
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
}
