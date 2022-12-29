import type { RichText, Task, User } from '@shared/domain';
import { Collection } from '@mikro-orm/core';
import { CardElement, CardElementType } from '../entity/cardElement.entity';
import { InputFormat } from './input-format.types';

// import { TaskResponse } from '@src/modules/task/controller/dto'

export type RichTextUpdate = {
	id?: string;
	text: RichText;
};
export interface ITaskCardUpdate {
	id?: string;
	title: string;
	text?: RichText[];
}

export interface ITaskCardCreate {
	title: string;
	text?: RichText[];
}

export enum CardType {
	'Text' = 'text',
	'Task' = 'task',
}

export type ICardCProps = {
	cardElements: CardElement[];
	cardType: CardType;
	creator: User;
	draggable: boolean;
};
export type ITaskCardProps = ICardCProps & { task: Task };

export interface ICard {
	cardElements: Collection<CardElement>;

	cardType: CardType;

	creator: User;

	draggable: boolean;
}

export interface ITaskCard extends ICard {
	task: Task;
}

export type ICardElement = {
	id: string;

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
