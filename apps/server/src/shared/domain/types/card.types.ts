import { CardElement, CardElementType } from '@shared/domain/entity/cardElement.entity';
import type { Task, User } from '@shared/domain';
import { CardType } from '@shared/domain';
import { InputFormat } from './input-format.types';

// import { TaskResponse } from '@src/modules/task/controller/dto'

export interface ITaskCardCreate {
	title: string;
	description?: string[];
}

export interface ICard {
	cardElements: CardElement[]; // ICardElement[];

	cardType: CardType;

	creator: User;

	draggable?: boolean;
}

export interface ITaskCard extends ICard {
	task: Task;
}

export type ICardElement = {
	cardElementType: CardElementType;
	// content: ITitleCardElement | IRichTextCardElement;
};

export type ITitleCardElement = {
	value: string;
};

export type IRichTextCardElement = {
	value: string;
	inputFormat: InputFormat;
};
