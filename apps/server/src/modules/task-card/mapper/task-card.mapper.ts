import { CardElementResponse, CreateTaskCardParams, TaskCardResponse } from '../controller/dto';
import { ITaskCreate, ITaskCardCreate, TaskCard } from '@shared/domain';
import { TaskCreateParams, TaskResponse } from '@src/modules/task/controller/dto';
import {
	CardElement,
	CardElementType,
	RichTextCardElement,
	TitleCardElement,
} from '@shared/domain/entity/cardElement.entity';
import { CardTitleElementResponse } from '@src/modules/task-card/controller/dto/card-title-element.response';
import { CardRichTextElementResponse } from '@src/modules/task-card/controller/dto/card-richtext-element.response';

export class TaskCardMapper {
	mapToResponse(card: TaskCard): TaskCardResponse {
		//const task = new TaskResponse(card.task);

		const dto = new TaskCardResponse({
			id: card.id,
			draggable: card.draggable,
			//task: card.task,
			cardElements: this.mapElements(card.cardElements),
		});

		return dto;
	}

	private mapElements(cardElements: CardElement[]): CardElementResponse[] {
		const elements = [];

		cardElements.forEach((element) => {
			if (element.cardElementType === CardElementType.Title) {
				elements.push(new CardTitleElementResponse(element as TitleCardElement));
			}
			if (element.cardElementType === CardElementType.RichText) {
				elements.push(new CardRichTextElementResponse(element as RichTextCardElement));
			}
		});

		return elements;
	}

	static mapCreateToDomain(params: CreateTaskCardParams): ITaskCardCreate {
		const dto = {
			title: params.title,
			description: params.description,
		};

		return dto;
	}
}

//export class ElementMapper
