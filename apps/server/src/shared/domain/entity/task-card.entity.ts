import {
	Collection,
	Entity,
	Enum,
	Index,
	// IdentifiedReference,
	ManyToMany,
	ManyToOne,
	OneToOne,
	Property,
	// wrap,
} from '@mikro-orm/core';
import { CardType, ICard, ITaskCardProps, ITaskCard } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import { CardElement } from './cardElement.entity';
import { Task } from './task.entity';
import { User } from './user.entity';

@Entity({
	tableName: 'card',
})
export class TaskCard extends BaseEntityWithTimestamps implements ICard, ITaskCard {
	constructor(props: ITaskCardProps) {
		super();

		this.draggable = props.draggable || true;
		this.cardType = props.cardType;

		this.cardElements.set(props.cardElements);
		this.task = props.task; // wrap(props.task).toReference();
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
	@OneToOne({ type: 'Task', fieldName: 'taskId', eager: true, unique: true })
	task!: Task;
}
