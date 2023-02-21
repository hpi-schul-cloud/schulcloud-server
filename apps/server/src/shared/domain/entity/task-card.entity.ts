import { Cascade, Entity, OneToOne, Property } from '@mikro-orm/core';
import { CardType, ICardCProps } from '../types';
import { Card } from './card.entity';
import { Task } from './task.entity';

export type ITaskCardProps = ICardCProps & { task: Task; dueDate: Date };

export interface ITaskCard {
	task: Task;
	dueDate: Date;
}

@Entity({
	tableName: 'card',
})
export class TaskCard extends Card implements ITaskCard {
	constructor(props: ITaskCardProps) {
		super();
		this.cardType = CardType.Task;

		if (props.draggable) {
			this.draggable = props.draggable;
		}

		if (props.visibleAtDate) {
			this.visibleAtDate = props.visibleAtDate;
		}

		this.dueDate = props.dueDate;

		this.cardElements.set(props.cardElements);
		this.task = props.task;
		Object.assign(this, { creator: props.creator });
	}

	@Property()
	dueDate: Date;

	@OneToOne({ type: 'Task', fieldName: 'taskId', eager: true, unique: true, cascade: [Cascade.ALL] })
	task!: Task;

	public isVisibleBeforeDueDate() {
		return this.visibleAtDate < this.dueDate;
	}
}
