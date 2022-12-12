import { Injectable } from '@nestjs/common';
import {
	TaskCard,
	EntityId,
	ITaskCard,
	ITaskCardCreate,
	// ITaskCreate,
	InputFormat,
	// TaskWithStatusVo,
	CardType,
} from '@shared/domain';
import { AuthorizationService } from '@src/modules';
import { CardRepo } from '@shared/repo';
import { TaskMapper } from '@src/modules/task/mapper/task.mapper';
// import { TaskResponse } from '@src/modules/task/controller/dto';
// import { TaskCardMapper } from '@src/modules/task-card/mapper/task-card.mapper';
import { TaskService } from '@src/modules/task/service';
import { CardElement, RichTextCardElement, TitleCardElement } from '@shared/domain/entity/cardElement.entity';

@Injectable()
export class TaskCardUc {
	constructor(
		private cardRepo: CardRepo,
		private readonly authorizationService: AuthorizationService,
		private readonly taskService: TaskService
	) {}

	async create(userId: EntityId, params: ITaskCardCreate) {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		const taskParams = {
			name: params.title,
		};
		const taskWithStatusVo = await this.taskService.create(userId, TaskMapper.mapTaskCreateToDomain(taskParams));

		const title = new TitleCardElement(params.title);
		let cardElements: CardElement[] = [title];
		if (params.description) {
			const inputFormat = InputFormat.RICH_TEXT_CK5;
			const texts = params.description.map((text) => new RichTextCardElement({ text, inputFormat }));
			cardElements.push(...texts);
		}

		const cardParams: ITaskCard = {
			cardElements,
			cardType: CardType.Task,
			creator: user,
			draggable: true,
			task: taskWithStatusVo.task,
		};

		const card = new TaskCard(cardParams);

		// await tahis.cardRepo.save(card);

		return { card, taskWithStatusVo };
	}

	// async findOne()
}
