import { Entity, Enum, Property } from '@mikro-orm/core';
import { InputFormat } from '../types/input-format.types';
import { BaseEntityWithTimestamps } from './base.entity';
import { RichText } from '@shared/domain';

export enum CardElementType {
	'Title' = 'title',
	'RichText' = 'richText',
}

export type CardElementProps = {
	cardElementType: CardElementType;
};

@Entity({
	discriminatorColumn: 'cardElementType',
	abstract: true,
	tableName: 'card-element',
})
export abstract class CardElement extends BaseEntityWithTimestamps {
	@Enum()
	cardElementType!: CardElementType;

	//@ManyToOne({ entity: () => TaskCard, wrappedReference: true })
	//card!: Card;

	// @Property()
	// content!: TitleCardElement | RichTextCardElement;

	static fromTitle(title: string): CardElement {
		const element = new TitleCardElement(title);
		return element;
	}

	static fromRichtext(richText: RichText): CardElement {
		const element = new RichTextCardElement(richText);
		return element;
	}
}

@Entity({
	discriminatorValue: CardElementType.Title,
})
export class TitleCardElement extends CardElement {
	constructor(title: string) {
		super();
		this.cardElementType = CardElementType.Title;
		this.value = title;
	}

	@Property()
	value!: string;
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

// availableFrom/Until date element
