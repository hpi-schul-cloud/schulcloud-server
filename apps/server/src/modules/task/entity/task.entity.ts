import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { LessonTaskInfo } from './lesson-task-info.entity';

interface ITaskProperties {
	name: string;
	dueDate?: Date;
	private?: boolean;
	parentId: ObjectId;
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

	hasWritePermission(userId: EntityId): boolean;
	getDescriptions(): IParentDescriptionsProperties;
	getStudentsNumber(): number;
}

@Entity({ tableName: 'homeworks' })
export class Task extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	dueDate?: Date;

	@Property()
	private: boolean;

	@Property({ fieldName: 'courseId' })
	parentId: ObjectId;

	@ManyToOne({ fieldName: 'lessonId' })
	lesson?: LessonTaskInfo; // In database exist also null, but it can not set.

	@Property({ persist: false })
	parent?: ITaskParent;

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
		return this.parentId.toHexString();
	}

	getName(): string {
		return this.name;
	}

	getDueDate(): Date | undefined {
		return this.dueDate;
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
		if (parent) {
			this.parentId = new ObjectId(parent.id);
		}
	}

	getParent(): ITaskParent | undefined {
		return this.parent;
	}
}
