import { Injectable } from '@nestjs/common';
import { TextCard, EntityId, ITaskCardProprieties, ITaskCardCreate, ITaskCreate } from '@shared/domain';
import { FeathersAuthorizationService } from '@src/modules/authorization/feathers-authorization.service';
import { CardRepo } from '@shared/repo';
import { TaskMapper } from '@src/modules/task/mapper/task.mapper';
import { TaskResponse } from '@src/modules/task/controller/dto';
import { TaskCardMapper } from '@src/modules/task-card/mapper/task-card.mapper';

@Injectable()
export class TaskCardUc {
	constructor(private cardRepo: CardRepo, private authorizationService: FeathersAuthorizationService) {}

	async create(userId: EntityId, params: ITaskCardCreate): Promise<TextCard> {
		//await this.authorizationService.

		const taskParams = {
			name: params.title,
		};
		const task = await this.taskUc.create(currentUser.userId, TaskMapper.mapTaskCreateToDomain(taskParams));

		const cardParams: ITaskCardProprieties = {
			...params,
			draggable: true,
			task,
		};

		const card = new TextCard(cardParams);

		// await this.cardRepo.save(card);
		return card;
	}

	//async findOne()
}
