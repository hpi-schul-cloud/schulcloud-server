import { Inject, Injectable } from '@nestjs/common';
import { TaskCard, EntityId, ITaskCard, ITaskCardCreate, CardType } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { CardElementRepo, TaskCardRepo } from '@shared/repo';
import { TaskMapper } from '@src/modules/task/mapper/task.mapper';
// import { TaskResponse } from '@src/modules/task/controller/dto';
// import { TaskCardMapper } from '@src/modules/task-card/mapper/task-card.mapper';
import { TaskService } from '@src/modules/task/service';
import { CardElement, RichTextCardElement, TitleCardElement } from '@shared/domain/entity/cardElement.entity';
// import { TaskUC } from '@src/modules/task/uc';

@Injectable()
export class TaskCardUc {
	constructor(
		private taskCardRepo: TaskCardRepo,
		private cardElementRepo: CardElementRepo,
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

		const title = CardElement.fromTitle(params.title);
		cardElements.unshift(title);
		await this.cardElementRepo.save(title);

		if (params.text) {
			const texts = params.text.map((text) => CardElement.fromRichtext(text));
			cardElements.push(...texts);
		}

		const cardParams: ITaskCard = {
			cardElements,
			cardType: CardType.Task,
			creator: user,
			task: taskWithStatusVo.task,
		};

		const card = new TaskCard(cardParams);

		await this.taskCardRepo.save(card);
		//await this.taskCardRepo.createTaskCard(card);

		return { card, taskWithStatusVo };
	}

	async find(userId: EntityId, id: EntityId) {
		// const user = await this.authorizationService.getUserWithPermissions(userId);
		const card = await this.taskCardRepo.findById(id);

		const taskWithStatusVo = await this.taskService.find(userId, card.task.id);
		// this.authorizationService.checkPermission(user, task, PermissionContextBuilder.read([Permission.HOMEWORK_VIEW]));
		return { card, taskWithStatusVo };
	}

	// async findOne()
}
