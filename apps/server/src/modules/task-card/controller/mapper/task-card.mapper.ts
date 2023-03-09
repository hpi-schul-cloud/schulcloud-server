import { ValidationError } from '@shared/common';
import {
	CardElement,
	CardElementResponse,
	CardRichTextElementResponse,
	RichText,
	TaskCard,
	TaskWithStatusVo,
} from '@shared/domain';
import { CardElementType, RichTextCardElement } from '@shared/domain/entity/card-element.entity';
import { TaskResponse } from '@src/modules/task/controller/dto';
import { TaskMapper } from '@src/modules/task/mapper';
import { ITaskCardCRUD } from '../../interface';
import { RichTextCardElementParam, TaskCardParams, TaskCardResponse } from '../dto';

export class TaskCardMapper {
	mapToResponse(card: TaskCard, taskWithStatusVo: TaskWithStatusVo): TaskCardResponse {
		const taskResponse: TaskResponse = TaskMapper.mapToResponse(taskWithStatusVo);

		const dto = new TaskCardResponse({
			id: card.id,
			draggable: card.draggable || true,
			task: taskResponse,
			visibleAtDate: card.visibleAtDate,
			dueDate: card.dueDate,
			title: card.title,
		});
		if (card.cardElements.length) {
			dto.cardElements = this.getCardElementResponse(card);
		}
		if (card.course) {
			dto.courseId = card.course.id;
			dto.courseName = card.course.name;
		}

		return dto;
	}

	private mapElements(cardElements: CardElement[]): CardElementResponse[] {
		const cardElementsResponse: CardElementResponse[] = [];
		cardElements.forEach((element) => {
			if (element.cardElementType === CardElementType.RichText) {
				const content = new CardRichTextElementResponse(element as RichTextCardElement);
				const response = { id: element.id, cardElementType: element.cardElementType, content };
				cardElementsResponse.push(response);
			}
		});

		return cardElementsResponse;
	}

	private getCardElementResponse(card: TaskCard): CardElementResponse[] {
		const cardElements = card.getCardElements();
		const cardElementsResponse = this.mapElements(cardElements);
		return cardElementsResponse;
	}

	static mapToDomain(params: TaskCardParams): ITaskCardCRUD {
		if (!params.title.length) {
			throw new ValidationError('The Task Card must have one title');
		}

		const dto: ITaskCardCRUD = {
			title: params.title,
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

		if (params.cardElements) {
			// TODO split following code into a separate method because it's too nested (and write tests for it)
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
		}

		return dto;
	}
}
