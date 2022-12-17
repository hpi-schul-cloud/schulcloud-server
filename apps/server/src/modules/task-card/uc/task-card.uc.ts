import { Inject, Injectable } from '@nestjs/common';
import { CardType, EntityId, ITaskCard, ITaskCardCreate, TaskCard } from '@shared/domain';
import { CardElement, RichTextCardElement, TitleCardElement } from '@shared/domain/entity/cardElement.entity';
import { TaskCardRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { TaskMapper } from '@src/modules/task/mapper/task.mapper';
import { TaskService } from '@src/modules/task/service';

@Injectable()
export class TaskCardUc {
	constructor(
		private taskCardRepo: TaskCardRepo,
		private readonly authorizationService: AuthorizationService,
		@Inject(TaskService) private readonly taskService: TaskService
	) {}

	async create(userId: EntityId, params: ITaskCardCreate) {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		const taskParams = {
			name: params.title,
		};
		const taskWithStatusVo = await this.taskService.create(userId, TaskMapper.mapTaskCreateToDomain(taskParams));

		const cardElements: CardElement[] = [];

		const title = new TitleCardElement(params.title); // CardElement.fromTitle(params.title);
		cardElements.unshift(title);

		if (params.text) {
			const texts = params.text.map((text) => new RichTextCardElement(text));
			cardElements.push(...texts);
		}

		const cardParams: ITaskCard = {
			cardElements,
			cardType: CardType.Task,
			creator: user,
			task: taskWithStatusVo.task,
		};

		const card = new TaskCard(cardParams); //Card.fromTaskCard(cardParams);

		await this.taskCardRepo.save(card);

		return { card, taskWithStatusVo };
	}

	async find(userId: EntityId, id: EntityId) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const card = await this.taskCardRepo.findById(id);
		//card.cardElements = card.getCardElements();
		//card.getCardElements()

		const taskWithStatusVo = await this.taskService.find(userId, card.task.id);
		//this.authorizationService.checkPermission(user, task, PermissionContextBuilder.read([Permission.HOMEWORK_VIEW]));
		return { card, taskWithStatusVo };
	}

	// async findOne()
}
