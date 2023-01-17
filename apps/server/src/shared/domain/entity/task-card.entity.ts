import { Cascade, Collection, Entity, Enum, Index, ManyToMany, ManyToOne, OneToOne, Property } from '@mikro-orm/core';
import { CardType, ICard, ICardCProps } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import { CardElement } from './cardElement.entity';
import { Task } from './task.entity';
import { User } from './user.entity';

export type ITaskCardProps = ICardCProps & { task: Task };

export interface ITaskCard extends ICard {
	task: Task;
}
@Entity({
	tableName: 'card',
})
export class TaskCard extends BaseEntityWithTimestamps implements ICard, ITaskCard {
	constructor(props: ITaskCardProps) {
		super();

		this.draggable = props.draggable || true;
		this.cardType = props.cardType;
		if (props.completionDate) this.completionDate = props.completionDate;

		this.cardElements.set(props.cardElements);
		this.task = props.task;
		this.cardType = CardType.Task;
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
	completionDate?: Date;

	public getCardElements() {
		return this.cardElements.getItems();
	}

	public pastCompletionDate(): boolean {
		const now = new Date(Date.now());
		if (this.completionDate) {
			const pastCompletionDate = now > this.completionDate;
			return pastCompletionDate;
		}
		return false;
	}

	@OneToOne({ type: 'Task', fieldName: 'taskId', eager: true, unique: true, cascade: [Cascade.ALL] })
	task!: Task;
}
