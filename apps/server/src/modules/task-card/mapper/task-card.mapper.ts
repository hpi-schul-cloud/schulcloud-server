import { CreateTaskCardParams, TaskCardResponse } from '../controller/dto';
import { ITaskCreate, ITextCardCreate, TextCard } from '@shared/domain';
import { TaskCreateParams } from '@src/modules/task/controller/dto';

export class TaskCardMapper {
	static mapToResponse(card: TaskCard): TaskCardResponse {
		const dto = new TaskCardResponse({
			id: card.id,
			draggable: card.draggable,
			// cardElements
			cardElements: card.cardElements,
			task: card.task,
		});

		return dto;
	}

	static mapCreateCardToDomain(params: CreateTaskCardParams): ITextCardCreate {
		const dto = {
			title: params.title,
			description: params.description,
		};

		return dto;
	}

	static mapTaskCardToTaskDomain(params: CreateTaskCardParams): ITaskCreate {
		const dto = {
			name: params.title,
		};

		return dto;
	}
}

//export class ElementMapper
