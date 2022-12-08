import { CardElement, CardElementType } from '@shared/domain/entity/cardElement.entity';
import type { Task } from '@shared/domain';
import { InputFormat } from '@shared/domain';

export interface ITaskCardCreate {
	title: string;
	description?: string[];
}

export interface ICard {
	draggable?: boolean;

	cardElements: CardElement[];
}

export interface ITaskCard extends ICard {
	task: Task;
}

export type ICardElement = {
	cardElementType: CardElementType;
	content: ITitleCardElement | IRichTextCardElement;
};

export type ITitleCardElement = {
	value: string;
};

export type IRichTextCardElement = {
	value: string;
	inputFormat: InputFormat;
};
