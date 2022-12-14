import {
	Collection,
	Entity,
	Enum,
	IdentifiedReference,
	Index,
	ManyToMany,
	ManyToOne,
	OneToOne,
	OneToMany,
	Property,
	wrap,
} from '@mikro-orm/core';
import { CardType, ITaskCard } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import { CardElement } from './cardElement.entity';
import { Task } from './task.entity';
import { User } from './user.entity';

export type CardProps = {
	cardElements: CardElement[];
	creator: User;
};

/* TODO
  using discriminatorValue in TaskCard leads to exception
  workaround is using discriminatorMap in the abstract class and tableName in all classes,
 */
@Entity({
	discriminatorColumn: 'cardType',
	discriminatorMap: { task: 'TaskCard' },
	abstract: true,
	tableName: 'card',
})
export abstract class Card extends BaseEntityWithTimestamps {
	//@OneToMany({ entity: () => CardElement, mappedBy: (cardElement) => cardElement.card, orphanRemoval: true }))
	@ManyToMany('CardElement', undefined, { fieldName: 'referenceIds' })
	cardElements = new Collection<CardElement>(this);

	@Enum()
	cardType!: CardType;

	@Index()
	@ManyToOne('User', { fieldName: 'userId' })
	creator!: User;

	@Property()
	draggable = true;

	@Property()
	isDraft = false;

	protected constructor(props: CardProps) {
		super();
		if (props.cardElements) {
			this.cardElements.set(props.cardElements);
		}
		Object.assign(this, { creator: props.creator });
	}

	/*
	static createInstance(cardType: CardType, props: CardProps): Card {
		let card: Card;
		if (cardType === CardType.Task) {
			card = new TaskCard(props);
		}

		return card;
	}*/

	// TODO
	getCardElements() {
		return this.cardElements.getItems();
	}

	/*
	reorderElements(ids: EntityId[]) {
		this.validateReordering();
	}

	private validateReordering(ids: EntityId[]) {
	}
	*/
}

@Entity({
	tableName: 'card',
})
export class TaskCard extends Card {
	constructor(props: ITaskCard) {
		super(props);
		//this.cardElements.set(props.cardElements);
		this.cardType = CardType.Task;

		if (props.draggable) {
			this.draggable = props.draggable;
		}

		this.task = wrap(props.task).toReference();
	}

	@Index()
	@OneToOne({ type: 'Task', fieldName: 'taskId', wrappedReference: true, unique: true })
	task!: IdentifiedReference<Task>;
}
