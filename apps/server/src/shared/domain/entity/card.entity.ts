import { Cascade, Collection, Enum, Index, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
import { CardType } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import { CardElement } from './cardElement.entity';
import { User } from './user.entity';

export abstract class Card extends BaseEntityWithTimestamps {
	@Enum()
	cardType!: CardType;

	@Index()
	@ManyToOne('User', { fieldName: 'userId' })
	creator!: User;

	@Property()
	draggable = true;

	@Property()
	visibleAtDate: Date = new Date();

	@ManyToMany('CardElement', undefined, { fieldName: 'cardElementsIds', cascade: [Cascade.ALL] })
	cardElements = new Collection<CardElement>(this);

	public getCardElements() {
		return this.cardElements.getItems();
	}
}
