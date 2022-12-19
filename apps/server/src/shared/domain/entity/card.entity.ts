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
import { CardType, ITaskCard } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import { CardElement } from './cardElement.entity';
import { Task } from './task.entity';
import { User } from './user.entity';

export type CardProps = {
	cardElements: CardElement[];
	creator: User;
};

@Entity({
	tableName: 'card',
})
export class TaskCard extends BaseEntityWithTimestamps {
	constructor(props: ITaskCard) {
		super();

		this.draggable = props.draggable || true;
		this.cardType = props.cardType;

		this.cardElements.set(props.cardElements);
		this.task = wrap(props.task).toReference();
		this.cardType = CardType.Task;
		Object.assign(this, { creator: props.creator });
	}

	@ManyToMany('CardElement', undefined, { fieldName: 'cardElementsIds' })
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

	@Index()
	@OneToOne({ type: 'Task', fieldName: 'taskId', wrappedReference: true, unique: true })
	task!: IdentifiedReference<Task>;
}
