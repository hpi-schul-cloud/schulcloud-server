import { Collection, Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { Course } from '@src/entities';
import type { Submission } from './submission.entity';
import { LessonTaskInfo } from './lesson-task-info.entity';

interface ITaskProperties {
	name: string;
	dueDate?: Date;
	private?: boolean;
	parent?: Course;
	lesson?: LessonTaskInfo;
	submissions?: Submission[];
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
	private = true;

	@ManyToOne({ fieldName: 'courseId' })
	parent?: Course;

	@ManyToOne({ fieldName: 'lessonId' })
	lesson?: LessonTaskInfo; // In database exist also null, but it can not set.

	@OneToMany('Submission', 'task')
	submissions = new Collection<Submission>(this);

	// getParentId(): EntityId | undefined {
	// 	return this.parent?.id;
	// }

	// getName(): string {
	// 	return this.name;
	// }

	// getDueDate(): Date | undefined {
	// 	return this.dueDate;
	// }

	// changePrivate(toValue?: boolean): boolean {
	// 	if (toValue) {
	// 		this.private = toValue;
	// 	} else {
	// 		this.private = !this.private;
	// 	}
	// 	return this.private;
	// }

	// setParent(parent: ITaskParent | undefined): void {
	// 	this.parent = parent;
	// 	if (parent) {
	// 		this.parentId = new ObjectId(parent.id);
	// 	}
	// }

	// getParent(): ITaskParent | undefined {
	// 	return this.parent;
	// }

	constructor(props: ITaskProperties) {
		super();
		this.name = props.name;
		this.dueDate = props.dueDate;
		this.private = !!props.private;
		this.parent = props.parent;
		this.lesson = props.lesson;
		this.submissions.set(props.submissions || []);
	}
}
