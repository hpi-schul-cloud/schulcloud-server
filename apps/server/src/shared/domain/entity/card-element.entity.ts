import { Entity, Enum, Property } from '@mikro-orm/core';
import { RichText } from '@shared/domain/types/rich-text.types';
import { InputFormat } from '../types/input-format.types';
import { BaseEntityWithTimestamps } from './base.entity';

export enum CardElementType {
	'RichText' = 'richText',
}

@Entity({
	discriminatorColumn: 'cardElementType',
	abstract: true,
	tableName: 'card-element',
})
export abstract class CardElement extends BaseEntityWithTimestamps {
	@Enum()
	cardElementType!: CardElementType;
}

@Entity({
	discriminatorValue: CardElementType.RichText,
})
export class RichTextCardElement extends CardElement {
	constructor(props: RichText) {
		super();
		this.cardElementType = CardElementType.RichText;
		this.inputFormat = props.type;
		this.value = props.content;
	}

	@Property()
	value!: string;

	@Property()
	inputFormat: InputFormat;
}
