import {
	Collection,
	Entity,
	Enum,
	IdentifiedReference,
	Index,
	ManyToMany,
	ManyToOne,
	OneToOne,
	Property,
	wrap,
} from '@mikro-orm/core';
import { ITaskCard } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import { CardElement } from './cardElement.entity';
import { Task } from './task.entity';
import { User } from './user.entity';

export type CardProps = {
	cardElements: CardElement[];
	creator: User;
};

export enum CardType {
	'Text' = 'text',
	'Task' = 'task',
}

@Entity({
	discriminatorColumn: 'cardElementType',
	tableName: 'card',
})
export abstract class Card extends BaseEntityWithTimestamps {
	constructor(props: CardProps) {
		super();
		this.cardElements.set(props.cardElements);
		this.creator = props.creator;
	}

	@ManyToMany('CardElement', undefined, { fieldName: 'cardElementIds' })
	cardElements = new Collection<CardElement>(this);

	@Enum()
	cardType!: CardType;

	@Index()
	@ManyToOne('User', { fieldName: 'userId' })
	creator: User;

	@Property()
	draggable = true;

	@Property()
	isDraft = false;

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

@Entity({ discriminatorValue: CardType.Text })
export class TextCard extends Card {
	constructor(props) {
		super(props);
		this.cardType = CardType.Text;
	}
}

@Entity({ discriminatorValue: CardType.Task })
export class TaskCard extends Card {
	constructor(props: ITaskCard) {
		super(props);
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
