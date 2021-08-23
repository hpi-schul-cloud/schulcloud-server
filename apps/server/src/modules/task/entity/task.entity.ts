import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { LessonTaskInfo } from './lesson-task-info.entity';

interface ITaskProperties {
	name: string;
	dueDate?: Date;
	private?: boolean;
	parentId: EntityId;
	lesson?: LessonTaskInfo;
}

export interface IParentDescriptionsProperties {
	id: EntityId;
	name: string;
	color: string;
	description?: string;
}

export interface ITaskParent {
	id: EntityId;

	getDescriptions(): IParentDescriptionsProperties;
	getStudentsNumber(): number;
}

@Entity({ tableName: 'homeworks' })
export class Task extends BaseEntityWithTimestamps {
	@Property()
	private name: string;

	@Property()
	private dueDate?: Date;

	@Property()
	private private: boolean;

	@Property({ fieldName: 'courseId' })
	private parentId: EntityId;

	@ManyToOne({ fieldName: 'lessonId' })
	private lesson?: LessonTaskInfo; // In database exist also null, but it can not set.

	@Property({ persist: false })
	private parent?: ITaskParent;

	constructor(props: ITaskProperties) {
		super();
		this.name = props.name;
		this.dueDate = props.dueDate;
		this.private = props.private || true;
		this.parentId = props.parentId;

		const lesson = props.lesson || null;
		Object.assign(this, { lesson });
	}

	getParentId(): EntityId {
		return this.parentId;
	}

	// | null do not work but is set in database
	getLesson(): LessonTaskInfo | undefined {
		return this.lesson;
	}

	getName(): string {
		return this.name;
	}

	// undefined?
	getDueDate(): Date | undefined {
		return this.dueDate;
	}

	isPrivate(): boolean {
		return this.private;
	}

	changePrivate(toValue?: boolean): boolean {
		if (toValue) {
			this.private = toValue;
		} else {
			this.private = !this.private;
		}
		return this.private;
	}

	setParent(parent: ITaskParent | undefined): void {
		this.parent = parent;
	}

	getParent(): ITaskParent | undefined {
		return this.parent;
	}
}
