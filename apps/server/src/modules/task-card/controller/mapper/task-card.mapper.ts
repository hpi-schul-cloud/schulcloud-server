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
import { CardElementParams, RichTextCardElementParam, TaskCardParams, TaskCardResponse } from '../dto';

export class TaskCardMapper {
	mapToResponse(card: TaskCard, taskWithStatusVo: TaskWithStatusVo): TaskCardResponse {
		const taskResponse: TaskResponse = TaskMapper.mapToResponse(taskWithStatusVo);

		const dto = new TaskCardResponse({
			id: card.id,
			draggable: card.draggable,
			task: taskResponse,
			visibleAtDate: card.visibleAtDate,
			dueDate: card.dueDate,
			title: card.title,
			courseId: card.course.id,
			courseName: card.course.name,
		});
		if (card.cardElements.length) {
			dto.cardElements = this.getCardElementResponse(card);
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
		if (!params.title || params.title.length === 0) {
			throw new ValidationError('The Task Card must have one title');
		}
		if (!params.courseId || params.courseId.length === 0) {
			throw new ValidationError('The Task Card must have one course');
		}

		const dto: ITaskCardCRUD = {
			title: params.title,
			courseId: params.courseId,
			dueDate: params.dueDate,
		};

		if (params.visibleAtDate) {
			dto.visibleAtDate = params.visibleAtDate;
		}

		if (params.cardElements) {
			const text = this.mapElementsToDto(params.cardElements);
			if (text) {
				dto.text = text;
			}
		}

		return dto;
	}

	private static mapElementsToDto(cardElements: CardElementParams[]): RichText[] | void {
		const text: RichText[] = [];
		cardElements.forEach((element) => {
			if (element.content instanceof RichTextCardElementParam) {
				const richText = new RichText({ content: element.content.value, type: element.content.inputFormat });
				text.push(richText);
			}
		});

		return text;
	}
}
