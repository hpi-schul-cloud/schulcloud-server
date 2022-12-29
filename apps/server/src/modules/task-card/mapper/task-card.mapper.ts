import {
	ICardElement,
	InputFormat,
	ITaskCardCreate,
	ITaskCardUpdate,
	RichText,
	TaskCard,
	TaskWithStatusVo,
} from '@shared/domain';
import { CardElementType, RichTextCardElement, TitleCardElement } from '@shared/domain/entity/cardElement.entity';
import { TaskResponse } from '@src/modules/task/controller/dto';
import { TaskMapper } from '@src/modules/task/mapper';
import { ValidationError } from '@shared/common';
import {
	CardElementResponse,
	CardRichTextElementResponse,
	CardTitleElementResponse,
	CreateTaskCardParams,
	UpdateTaskCardParams,
	TaskCardResponse,
	TitleCardElementParam,
	RichTextCardElementParam,
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
				const response = { id: cardElement.id, cardElementType: cardElement.cardElementType, content };
				cardElementsResponse.push(response);
			}
			if (cardElement.cardElementType === CardElementType.RichText) {
				const content = new CardRichTextElementResponse(cardElement as RichTextCardElement);
				const response = { id: cardElement.id, cardElementType: cardElement.cardElementType, content };
				cardElementsResponse.push(response);
			}
		});

		return cardElementsResponse;
	}

	static mapCreateToDomain(params: CreateTaskCardParams): ITaskCardCreate {
		const dto: ITaskCardCreate = {
			title: params.title,
		};

		if (params.text) {
			dto.text = params.text.map(
				(content) =>
					new RichText({
						content,
						type: InputFormat.RICH_TEXT_CK5,
					})
			);
		}

		return dto;
	}

	static mapUpdateToDomain(params: UpdateTaskCardParams): ITaskCardUpdate {
		const title = params.cardElements.filter((element) => element.content instanceof TitleCardElementParam);
		if (title.length !== 1) {
			throw new ValidationError('The Task Card must have one title');
		}

		const dto: ITaskCardUpdate = {
			title: title[0].content.value,
		};

		params.cardElements.forEach((element) => {
			if (element.content instanceof RichTextCardElementParam) {
				const richText = new RichText({ content: element.content.value, type: element.content.inputFormat });
				if (!dto.text) {
					dto.text = [richText];
				} else {
					dto.text.push();
				}
			}
		});

		return dto;
	}
}

// export class ElementMapper
