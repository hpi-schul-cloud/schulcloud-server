import type { User } from '@shared/domain';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Collection } from '@mikro-orm/core';
import { CardElement, CardElementType, RichTextCardElement, TitleCardElement } from '../entity/cardElement.entity';
import { InputFormat } from './input-format.types';

export enum CardType {
	// 'Text' = 'text',
	'Task' = 'task',
}

export type ICardCProps = {
	cardElements: CardElement[];
	cardType: CardType;
	creator: User;
	draggable: boolean;
};

export interface ICard {
	cardElements: Collection<CardElement>;

	cardType: CardType;

	creator: User;

	draggable: boolean;
}

export class CardTitleElementResponse {
	constructor(props: TitleCardElement) {
		this.value = props.value;
	}

	@ApiProperty()
	value!: string;
}

export class CardRichTextElementResponse {
	constructor(props: RichTextCardElement) {
		this.value = props.value;
		this.inputFormat = props.inputFormat;
	}

	@ApiProperty({
		description: 'The value of the rich text',
	})
	value!: string;

	@ApiProperty({
		description: 'The input format type of the rich text',
		enum: InputFormat,
	})
	inputFormat!: InputFormat;
}

@ApiExtraModels(CardTitleElementResponse, CardRichTextElementResponse)
export class CardElementResponse {
	@ApiProperty({
		description: 'The id of the card element',
	})
	id!: string;

	@ApiProperty({
		description: 'Type of element',
		enum: CardElementType,
	})
	cardElementType!: CardElementType;

	@ApiProperty({
		description: 'Content of the element, depending of type',
		oneOf: [{ $ref: getSchemaPath(CardTitleElementResponse) }, { $ref: getSchemaPath(CardRichTextElementResponse) }],
	})
	content!: CardTitleElementResponse | CardRichTextElementResponse;
}
