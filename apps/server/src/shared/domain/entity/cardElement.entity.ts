import { Entity, Enum, Property } from '@mikro-orm/core';
import { InputFormat } from '../types/input-format.types';
import { BaseEntityWithTimestamps } from './base.entity';

export enum CardElementType {
	'Title' = 'title',
	'RichText' = 'richText',
}

@Entity({
	discriminatorValue: 'cardElementType',
	abstract: true,
})
export abstract class CardElement extends BaseEntityWithTimestamps {
	@Enum()
	cardElementType!: CardElementType;

	// @Property()
	// content!: TitleCardElement | RichTextCardElement;
}

@Entity({ discriminatorValue: CardElementType.Title })
export class TitleCardElement extends CardElement {
	constructor(title: string) {
		super();
		this.cardElementType = CardElementType.Title;
		this.value = title;
	}

	@Property()
	value!: string;
}

@Entity({ discriminatorValue: CardElementType.RichText })
export class RichTextCardElement extends CardElement {
	constructor(props: { text: string; inputFormat: InputFormat }) {
		super();
		this.cardElementType = CardElementType.RichText;
		this.inputFormat = props.inputFormat;
		this.value = props.text;
	}

	@Property()
	value!: string;

	@Property()
	inputFormat: InputFormat;
}

// availableFrom/Until date element
