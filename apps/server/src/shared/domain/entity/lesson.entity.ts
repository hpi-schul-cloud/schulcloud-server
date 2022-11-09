import { Collection, Entity, Index, ManyToMany, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { InternalServerErrorException } from '@nestjs/common';
import { ILearnroomElement } from '@shared/domain/interface';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';
import { CourseGroup } from './coursegroup.entity';
import { Material } from './materials.entity';
import { ITaskParent, Task } from './task.entity';
import { User } from './user.entity';

export interface ILessonProperties {
	name: string;
	hidden: boolean;
	course: Course;
	courseGroup?: CourseGroup;
	position?: number;
	contents: IComponentProperties[] | [];
	materials?: Material[];
}

export enum ComponentType {
	ETHERPAD = 'Etherpad',
	GEOGEBRA = 'geoGebra',
	INTERNAL = 'internal',
	LERNSTORE = 'resources',
	TEXT = 'text',
	NEXBOARD = 'neXboard',
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

export interface IComponentNexboardProperties {
	board: string;
	description: string;
	title: string;
	url: string;
}

export interface IComponentInternalProperties {
	url: string;
}

export interface IComponentProperties {
	title?: string;
	hidden: boolean;
	component: ComponentType;
	user?: User;
	content?:
		| IComponentTextProperties
		| IComponentGeogebraProperties
		| IComponentLernstoreProperties
		| IComponentEtherpadProperties
		| IComponentInternalProperties
		| IComponentNexboardProperties;
}

export interface ILessonParent {
	getUserIds(): EntityId[];
}

@Entity({ tableName: 'lessons' })
export class Lesson extends BaseEntityWithTimestamps implements ILearnroomElement, ITaskParent {
	@Property()
	name: string;

	@Index()
	@Property()
	hidden = false;

	@Index()
	@ManyToOne('Course', { fieldName: 'courseId' })
	course: Course;

	@ManyToOne('CourseGroup', { fieldName: 'courseGroupId', nullable: true })
	courseGroup?: CourseGroup;

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
		this.courseGroup = props.courseGroup;
		this.position = props.position || 0;
		this.contents = props.contents;
		if (props.materials) this.materials.set(props.materials);
	}

	private getParent(): ILessonParent {
		const parent = this.courseGroup || this.course;

		return parent;
	}

	private getTasksItems(): Task[] {
		if (!this.tasks.isInitialized(true)) {
			throw new InternalServerErrorException('Lessons trying to access their tasks that are not loaded.');
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

	getLessonMaterials(): Material[] {
		if (!this.materials.isInitialized(true)) {
			throw new InternalServerErrorException('Lessons trying to access their materials that are not loaded.');
		}
		const materials = this.materials.getItems();
		return materials;
	}

	getSchoolId(): EntityId {
		if (!this.courseGroup) {
			return this.course.school.id;
		}

		return this.courseGroup.school.id;
	}

	publish() {
		this.hidden = false;
	}

	unpublish() {
		this.hidden = true;
	}

	getUserIds(): EntityId[] {
		const parent = this.getParent();
		const userIds = parent.getUserIds();

		return userIds;
	}
}
