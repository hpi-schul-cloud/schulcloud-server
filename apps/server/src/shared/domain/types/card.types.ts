import type { RichText, Task, User } from '@shared/domain';
import { CardElement, CardElementType } from '../entity/cardElement.entity';
import { InputFormat } from './input-format.types';

// import { TaskResponse } from '@src/modules/task/controller/dto'

export interface ITaskCardCreate {
	title: string;
	text?: RichText[];
}

export enum CardType {
	'Text' = 'text',
	'Task' = 'task',
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
