import { Entity, Enum, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import { InputFormat } from '@shared/domain';

export enum CardElementType {
	'Title' = 'title',
	'RichText' = 'richText',
}

@Entity({
	discriminatorValue: 'cardElementType',
	abstract: true,
})
export abstract class CardElement extends BaseEntityWithTimestamps {
	// TODO do we need constructor?
	// TODO add type for props
	constructor(props) {
		super();
	}

	@Enum()
	cardElementType!: CardElementType;
}

@Entity({ discriminatorValue: CardElementType.Title })
export class TitleCardElement extends CardElement {
	constructor(props) {
		super(props);
		this.cardElementType = CardElementType.Title;
	}

	@Property()
	value!: String;
}

@Entity({ discriminatorValue: CardElementType.RichText })
export class RichTextCardElement extends CardElement {
	constructor(props: { valueInputFormat: InputFormat }) {
		super(props);
		this.cardElementType = CardElementType.RichText;
		this.valueInputFormat = props.valueInputFormat;
	}

	@Property()
	value!: String;

	@Property()
	valueInputFormat: InputFormat;
}

// availableFrom/Until date element
