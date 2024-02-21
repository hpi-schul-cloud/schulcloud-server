import { Collection, Entity, Index, ManyToMany, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { InternalServerErrorException } from '@nestjs/common';
import { LearnroomElement } from '@shared/domain/interface';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';
import { CourseGroup } from './coursegroup.entity';
import { Material } from './materials.entity';
import type { TaskParent } from './task.entity';
import { Task } from './task.entity';

export interface LessonProperties {
	name: string;
	hidden: boolean;
	course: Course;
	courseGroup?: CourseGroup;
	position?: number;
	contents: ComponentProperties[] | [];
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

export interface ComponentTextProperties {
	text: string;
}

export interface ComponentGeogebraProperties {
	materialId: string;
}

export interface ComponentLernstoreProperties {
	resources: {
		client: string;
		description: string;
		merlinReference?: string;
		title: string;
		url: string;
	}[];
}

export interface ComponentEtherpadProperties {
	description: string;
	title: string;
	url: string;
}

export interface ComponentNexboardProperties {
	board: string;
	description: string;
	title: string;
	url: string;
}

export interface ComponentInternalProperties {
	url: string;
}

export type ComponentProperties = {
	_id?: string;
	title: string;
	hidden: boolean;
	user?: EntityId;
} & (
	| { component: ComponentType.TEXT; content: ComponentTextProperties }
	| { component: ComponentType.ETHERPAD; content: ComponentEtherpadProperties }
	| { component: ComponentType.GEOGEBRA; content: ComponentGeogebraProperties }
	| { component: ComponentType.INTERNAL; content: ComponentInternalProperties }
	| { component: ComponentType.LERNSTORE; content?: ComponentLernstoreProperties }
	| { component: ComponentType.NEXBOARD; content: ComponentNexboardProperties }
);

export interface LessonParent {
	getStudentIds(): EntityId[];
}

@Entity({ tableName: 'lessons' })
export class LessonEntity extends BaseEntityWithTimestamps implements LearnroomElement, TaskParent {
	@Property()
	name: string;

	@Index()
	@Property({ type: 'boolean' })
	hidden = false;

	@Index()
	@ManyToOne('Course', { fieldName: 'courseId' })
	course: Course;

	@ManyToOne('CourseGroup', { fieldName: 'courseGroupId', nullable: true })
	courseGroup?: CourseGroup;

	@Property()
	position: number;

	@Property()
	contents: ComponentProperties[] | [];

	@ManyToMany('Material', undefined, { fieldName: 'materialIds' })
	materials = new Collection<Material>(this);

	@OneToMany('Task', 'lesson', { orphanRemoval: true })
	tasks = new Collection<Task>(this);

	constructor(props: LessonProperties) {
		super();
		this.name = props.name;
		if (props.hidden !== undefined) this.hidden = props.hidden;
		this.course = props.course;
		this.courseGroup = props.courseGroup;
		this.position = props.position || 0;
		this.contents = props.contents;
		if (props.materials) this.materials.set(props.materials);
	}

	private getParent(): LessonParent {
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
		const filtered = tasks.filter((task) => task.isPublished());
		return filtered.length;
	}

	getNumberOfDraftTasks(): number {
		const tasks = this.getTasksItems();
		const filtered = tasks.filter((task) => task.isDraft());
		return filtered.length;
	}

	getNumberOfPlannedTasks(): number {
		const tasks = this.getTasksItems();
		const filtered = tasks.filter((task) => task.isPlanned());
		return filtered.length;
	}

	getLessonComponents(): ComponentProperties[] | [] {
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

	public getStudentIds(): EntityId[] {
		const parent = this.getParent();
		const studentIds = parent.getStudentIds();

		return studentIds;
	}
}

export function isLesson(reference: unknown): reference is LessonEntity {
	return reference instanceof LessonEntity;
}
