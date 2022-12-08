import { Injectable } from '@nestjs/common';
import { TaskCard, EntityId, ITaskCard, ITaskCardCreate, ITaskCreate, InputFormat } from '@shared/domain';
import { FeathersAuthorizationService } from '@src/modules/authorization/feathers-authorization.service';
import { CardRepo } from '@shared/repo';
import { TaskMapper } from '@src/modules/task/mapper/task.mapper';
import { TaskResponse } from '@src/modules/task/controller/dto';
import { TaskCardMapper } from '@src/modules/task-card/mapper/task-card.mapper';
import { TaskService } from '@src/modules/task/service';
import { CardElement, RichTextCardElement, TitleCardElement } from '@shared/domain/entity/cardElement.entity';

@Injectable()
export class TaskCardUc {
	constructor(
		private cardRepo: CardRepo,
		private authorizationService: FeathersAuthorizationService,
		private readonly taskService: TaskService
	) {}

	async create(userId: EntityId, params: ITaskCardCreate): Promise<TaskCard> {
		//await this.authorizationService.

		const taskParams = {
			name: params.title,
		};
		const task = await this.taskService.create(userId, TaskMapper.mapTaskCreateToDomain(taskParams));

		const title = new TitleCardElement(params.title);
		let texts = [];
		if (params.description) {
			const inputFormat = InputFormat.RICH_TEXT_CK5;
			const texts = params.description.map((text) => new RichTextCardElement({ text, inputFormat }));
		}
		let cardElements: CardElement[] = [title, ...texts];

		const cardParams: ITaskCard = {
			cardElements,
			draggable: true,
			task: task.task,
		};

		const card = new TextCard(cardParams);

		// await this.cardRepo.save(card);
		return card;
	}

	//async findOne()
}
