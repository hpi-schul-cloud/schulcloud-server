import { ValidationError } from '@shared/common';
import {
	CardElement,
	CardElementResponse,
	CardRichTextElementResponse,
	CardTitleElementResponse,
	RichText,
	TaskCard,
	TaskWithStatusVo,
} from '@shared/domain';
import { CardElementType, RichTextCardElement, TitleCardElement } from '@shared/domain/entity/cardElement.entity';
import { TaskResponse } from '@src/modules/task/controller/dto';
import { TaskMapper } from '@src/modules/task/mapper';
import { ITaskCardCRUD } from '../../interface';
import { RichTextCardElementParam, TaskCardParams, TaskCardResponse, TitleCardElementParam } from '../dto';

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
			visibleAtDate: card.visibleAtDate,
			dueDate: card.dueDate,
		});

		if (card.course) {
			dto.courseId = card.course.id;
			dto.courseName = card.course.name;
		}

		return dto;
	}

	private mapElements(cardElements: CardElement[]): CardElementResponse[] {
		const cardElementsResponse: CardElementResponse[] = [];
		cardElements.forEach((element) => {
			if (element.cardElementType === CardElementType.Title) {
				const content = new CardTitleElementResponse(element as TitleCardElement);
				const response = { id: element.id, cardElementType: element.cardElementType, content };
				cardElementsResponse.push(response);
			}
			if (element.cardElementType === CardElementType.RichText) {
				const content = new CardRichTextElementResponse(element as RichTextCardElement);
				const response = { id: element.id, cardElementType: element.cardElementType, content };
				cardElementsResponse.push(response);
			}
		});

		return cardElementsResponse;
	}

	static mapToDomain(params: TaskCardParams): ITaskCardCRUD {
		const title = params.cardElements.filter((element) => element.content instanceof TitleCardElementParam);
		if (title.length !== 1) {
			throw new ValidationError('The Task Card must have one title');
		}

		const titleValue = title[0].content as TitleCardElementParam;
		const dto: ITaskCardCRUD = {
			title: titleValue.value,
		};

		if (params.courseId) {
			dto.courseId = params.courseId;
		}

		if (params.visibleAtDate) {
			dto.visibleAtDate = params.visibleAtDate;
		}

		if (params.dueDate) {
			dto.dueDate = params.dueDate;
		}

		params.cardElements.forEach((element) => {
			if (element.content instanceof RichTextCardElementParam) {
				const richText = new RichText({ content: element.content.value, type: element.content.inputFormat });
				if (!dto.text) {
					dto.text = [richText];
				} else {
					dto.text.push(richText);
				}
			}
		});

		return dto;
	}
}
