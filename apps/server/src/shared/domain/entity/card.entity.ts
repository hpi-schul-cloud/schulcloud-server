import {
	BooleanType,
	Collection,
	Entity,
	Enum,
	IdentifiedReference,
	Index,
	ManyToMany,
	ManyToOne,
	OneToOne,
	Property,
} from '@mikro-orm/core';
import { EntityId, ITaskCard } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import { CardElement } from './cardElement.entity';
import { Task } from './task.entity';

export type CardProps = {
	cardElements: CardElement[];
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
	}

	@ManyToMany('CardElement', undefined, { fieldName: 'cardElementIds' })
	cardElements = new Collection<CardElement>(this);

	@Enum()
	cardType!: CardType;

	@Property()
	draggable: boolean = true;

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
		//this.task = props.task;
	}

	@Index()
	@OneToOne({ type: 'Task', fieldName: 'taskId', wrappedReference: true, unique: true })
	task!: IdentifiedReference<Task>;
}
