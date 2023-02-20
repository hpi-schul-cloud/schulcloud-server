import { Cascade, Collection, Entity, Enum, Index, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
import { CardType, ICard, ICardCProps } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import { CardElement } from './cardElement.entity';
import { User } from './user.entity';

@Entity({
	tableName: 'cards',
	abstract: true,
	discriminatorColumn: 'cardType',
})
export class MetaCard extends BaseEntityWithTimestamps implements ICard {
	constructor(props: ICardCProps) {
		super();

		this.draggable = props.draggable || true;
		this.visibleAtDate = props.visibleAtDate;

		this.cardElements.set(props.cardElements);
		Object.assign(this, { creator: props.creator });
	}

	@ManyToMany('CardElement', undefined, { fieldName: 'cardElementsIds', cascade: [Cascade.ALL] })
	cardElements = new Collection<CardElement>(this);

	@Enum()
	cardType!: CardType;

	@Index()
	@ManyToOne('User', { fieldName: 'userId' })
	creator!: User;

	@Property()
	draggable = true;

	@Property({ nullable: true })
	visibleAtDate?: Date;

	public getCardElements() {
		return this.cardElements.getItems();
	}
}

@Entity({ discriminatorValue: CardType.LegacyTaskReference })
export class LegacyTaskReferenceCard extends MetaCard {
	constructor(props: ICardCProps) {
		super(props);
		this.cardType = CardType.LegacyTaskReference;
	}
}
