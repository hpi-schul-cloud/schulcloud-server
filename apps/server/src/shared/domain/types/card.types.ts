import { Collection } from '@mikro-orm/core';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import type { User } from '@shared/domain';
import { CardElement, CardElementType, RichTextCardElement } from '../entity/card-element.entity';
import { InputFormat } from './input-format.types';

export enum CardType {
	'Task' = 'task',
}

export type ICardCProps = {
	cardElements: CardElement[];
	cardType: CardType;
	creator: User;
	draggable: boolean;
	title: string;
};

export interface ICard {
	cardElements: Collection<CardElement>;
	cardType: CardType;
	creator: User;
	draggable: boolean;
	title: string;
}

export class CardRichTextElementResponse {
	constructor(props: RichTextCardElement) {
		this.value = props.value;
		this.inputFormat = props.inputFormat;
	}

	@ApiProperty({
		description: 'The value of the rich text card element',
	})
	value!: string;

	@ApiProperty({
		description: 'The input format type of the rich text content',
		enum: InputFormat,
	})
	inputFormat!: InputFormat;
}

@ApiExtraModels(CardRichTextElementResponse)
export class CardElementResponse {
	@ApiProperty({
		description: 'The id of the card element',
	})
	id!: string;

	@ApiProperty({
		description: 'Type of card element',
		enum: CardElementType,
	})
	cardElementType!: CardElementType;

	@ApiProperty({
		description: 'Content of the card element, depending on its type',
		oneOf: [{ $ref: getSchemaPath(CardRichTextElementResponse) }],
	})
	content!: CardRichTextElementResponse;
}
