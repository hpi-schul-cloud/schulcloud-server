import { Collection, Entity, Index, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { ILearnroomElement } from '@shared/domain/interface';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';
import { Task } from './task.entity';

export interface ILessonProperties {
	name: string;
	hidden: boolean;
	course: Course;
	position?: number;
	contents: IComponentProperties[] | [];
}

export enum ComponentType {
	TEXT = 'text',
	LERNSTORE = 'resources',
	GEOGEBRA = 'geoGebra',
}

export interface IComponentTextProperties {
	text: string;
}

export interface IComponentGeogebraProperties {
	materialId: string;
}

export interface IComponentLernstoreProperties {
	resources: [
		{
			url: string;
			title: string;
			description: string;
			client: string;
			merlinReference?: string;
		}
	];
}

export interface IComponentProperties {
	title: string;
	hidden: boolean;
	component: ComponentType;
	content: IComponentTextProperties | IComponentGeogebraProperties | IComponentLernstoreProperties;
}

@Entity({ tableName: 'lessons' })
export class Lesson extends BaseEntityWithTimestamps implements ILearnroomElement {
	@Property()
	name: string;

	@Index()
	@Property()
	hidden = false;

	@Index()
	@ManyToOne('Course', { fieldName: 'courseId' })
	course: Course;

	@Property()
	position: number;

	@Property()
	contents: IComponentProperties[] | [];

	@OneToMany('Task', 'lesson', { orphanRemoval: true })
	tasks = new Collection<Task>(this);

	constructor(props: ILessonProperties) {
		super();
		this.name = props.name;
		if (props.hidden !== undefined) this.hidden = props.hidden;
		this.course = props.course;
		this.position = props.position || 0;
		this.contents = props.contents;
	}

	private getTasksItems(): Task[] {
		if (!this.tasks.isInitialized(true)) {
			throw new Error('Lessons trying to access their tasks that are not loaded.');
		}
		const tasks = this.tasks.getItems();
		return tasks;
	}

	getNumberOfPublishedTasks(): number {
		const tasks = this.getTasksItems();
		const filtered = tasks.filter((task) => {
			return task.isPublished();
		});
		return filtered.length;
	}

	getNumberOfDraftTasks(): number {
		const tasks = this.getTasksItems();
		const filtered = tasks.filter((task) => {
			return task.isDraft();
		});
		return filtered.length;
	}

	getNumberOfPlannedTasks(): number {
		const tasks = this.getTasksItems();
		const filtered = tasks.filter((task) => {
			return task.isPlanned();
		});
		return filtered.length;
	}

	getLessonComponents(): IComponentProperties[] | [] {
		return this.contents;
	}

	publish() {
		this.hidden = false;
	}

	unpublish() {
		this.hidden = true;
	}
}
