import { CardElement, CardElementType } from '../entity/cardElement.entity';
import type { Task } from '../entity/task.entity';
import type { User } from '../entity/user.entity';
import { InputFormat } from './input-format.types';

// import { TaskResponse } from '@src/modules/task/controller/dto'

export interface ITaskCardCreate {
	title: string;
	description?: string[];
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
