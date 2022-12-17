import { ITaskCardCreate, TaskCard, TaskWithStatusVo, ICardElement } from '@shared/domain';
import { TaskResponse } from '@src/modules/task/controller/dto';
import { CardElementType, RichTextCardElement, TitleCardElement } from '@shared/domain/entity/cardElement.entity';
import { TaskMapper } from '@src/modules/task/mapper';
import {
	CardTitleElementResponse,
	CardRichTextElementResponse,
	CardElementResponse,
	CreateTaskCardParams,
	TaskCardResponse,
} from '../controller/dto';

export class TaskCardMapper {
	mapToResponse(card: TaskCard, taskWithStatusVo: TaskWithStatusVo): TaskCardResponse {
		const taskResponse: TaskResponse = TaskMapper.mapToResponse(taskWithStatusVo);
		const cardElements = card.getCardElements();
		const cardElementsResponse = this.mapElements(cardElements);

		const dto = new TaskCardResponse({
			id: card.id,
			draggable: card.draggable || true,
			cardElements: cardElementsResponse,
			task: taskResponse,
		});

		return dto;
	}

	private mapElements(cardElements: ICardElement[]): CardElementResponse[] {
		const cardElementsResponse: CardElementResponse[] = [];
		cardElements.forEach((cardElement) => {
			if (cardElement.cardElementType === CardElementType.Title) {
				const content = new CardTitleElementResponse(cardElement as TitleCardElement);
				const response = { cardElementType: cardElement.cardElementType, content };
				cardElementsResponse.push(response);
			}
			if (cardElement.cardElementType === CardElementType.RichText) {
				const content = new CardRichTextElementResponse(cardElement as RichTextCardElement);
				const response = { cardElementType: cardElement.cardElementType, content };
				cardElementsResponse.push(response);
			}
		});

		return cardElementsResponse;
	}

	static mapCreateToDomain(params: CreateTaskCardParams): ITaskCardCreate {
		const dto = {
			title: params.title,
			text: params.text,
		};

		return dto;
	}
}

// export class ElementMapper
