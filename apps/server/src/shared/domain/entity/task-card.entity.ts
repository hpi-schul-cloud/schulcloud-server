import { Cascade, Collection, Entity, Enum, Index, ManyToMany, ManyToOne, OneToOne, Property } from '@mikro-orm/core';
import { CardType, ICard, ICardCProps } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import { CardElement } from './card-element.entity';
import { Course } from './course.entity';
import { Task } from './task.entity';
import { User } from './user.entity';

export type ITaskCardProps = ICardCProps & { task: Task; dueDate: Date; course?: Course };

export interface ITaskCard extends ICard {
	task: Task;
	dueDate: Date;
	course?: Course;
}
@Entity({
	tableName: 'card',
})
export class TaskCard extends BaseEntityWithTimestamps implements ICard, ITaskCard {
	constructor(props: ITaskCardProps) {
		super();

		this.draggable = props.draggable || true;
		this.cardType = props.cardType;
		this.visibleAtDate = props.visibleAtDate;
		this.dueDate = props.dueDate;

		this.cardElements.set(props.cardElements);
		this.task = props.task;
		this.cardType = CardType.Task;
		this.title = props.title;
		if (props.course) this.course = props.course;
		Object.assign(this, { creator: props.creator });
	}

	@ManyToMany('CardElement', undefined, { fieldName: 'cardElementsIds', cascade: [Cascade.ALL] })
	cardElements = new Collection<CardElement>(this);

	@Enum()
	cardType!: CardType;

	@Index()
	@ManyToOne('User', { fieldName: 'userId' })
	creator!: User;

	@Index()
	@ManyToOne('Course', { fieldName: 'courseId', nullable: true })
	course?: Course;

	@Property()
	draggable = true;

	@Property()
	title!: string;

	@Property()
	visibleAtDate: Date;

	@Property()
	dueDate: Date;

	public getCardElements() {
		return this.cardElements.getItems();
	}

	public isVisibleBeforeDueDate() {
		return this.visibleAtDate < this.dueDate;
	}

	@OneToOne({ type: 'Task', fieldName: 'taskId', eager: true, unique: true, cascade: [Cascade.ALL] })
	task!: Task;
}
