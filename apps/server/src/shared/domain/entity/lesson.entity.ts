import { Collection, Entity, Index, ManyToMany, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { ILearnroomElement } from '@shared/domain/interface';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';
import { Material } from './materials.entity';
import { Task } from './task.entity';

export interface ILessonProperties {
	name: string;
	hidden: boolean;
	course: Course;
	position?: number;
	contents: IComponentProperties[] | [];
	materials?: Material[];
}

export enum ComponentType {
	ETHERPAD = 'Etherpad',
	GEOGEBRA = 'geoGebra',
	LERNSTORE = 'resources',
	TEXT = 'text',
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
			client: string;
			description: string;
			merlinReference?: string;
			title: string;
			url: string;
		}
	];
}

export interface IComponentEtherpadProperties {
	description: string;
	title: string;
	url: string;
}

export interface IComponentProperties {
	title: string;
	hidden: boolean;
	component: ComponentType;
	content:
		| IComponentTextProperties
		| IComponentGeogebraProperties
		| IComponentLernstoreProperties
		| IComponentEtherpadProperties;
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

	@ManyToMany('Material', undefined, { fieldName: 'materialIds' })
	materials = new Collection<Material>(this);

	@OneToMany('Task', 'lesson', { orphanRemoval: true })
	tasks = new Collection<Task>(this);

	constructor(props: ILessonProperties) {
		super();
		this.name = props.name;
		if (props.hidden !== undefined) this.hidden = props.hidden;
		this.course = props.course;
		this.position = props.position || 0;
		this.contents = props.contents;
		if (props.materials) this.materials.set(props.materials);
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

	getLessonLinkedTasks(): Task[] {
		const tasks = this.getTasksItems();
		return tasks;
	}

	publish() {
		this.hidden = false;
	}

	unpublish() {
		this.hidden = true;
	}
}
