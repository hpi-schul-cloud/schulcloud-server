import { Collection, Entity, Index, ManyToMany, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { CourseEntity } from '@modules/course/repo/course.entity';
import { CourseGroupEntity } from '@modules/course/repo/coursegroup.entity';
import type { TaskParent, TaskStateLike } from '@modules/task/repo/task-entity.types';
import { InternalServerErrorException } from '@nestjs/common';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { LernstoreResources } from '../api/dto/lernstore.resources';
import type { LessonParent } from './lesson.types';
import { Material } from './materials.entity';

export interface LessonProperties {
	name: string;
	hidden: boolean;
	course: CourseEntity;
	courseGroup?: CourseGroupEntity;
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
}

export interface ComponentTextProperties {
	text: string;
}

export interface ComponentGeogebraProperties {
	materialId: string;
}

export interface ComponentLernstoreProperties {
	resources: Array<LernstoreResources>;
}

export interface ComponentEtherpadProperties {
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
	user?: ObjectId;
} & (
	| { component: ComponentType.TEXT; content: ComponentTextProperties }
	| { component: ComponentType.ETHERPAD; content: ComponentEtherpadProperties }
	| { component: ComponentType.GEOGEBRA; content: ComponentGeogebraProperties }
	| { component: ComponentType.INTERNAL; content: ComponentInternalProperties }
	| { component: ComponentType.LERNSTORE; content?: ComponentLernstoreProperties }
);

@Entity({ tableName: 'lessons' })
export class LessonEntity extends BaseEntityWithTimestamps implements TaskParent {
	@Property()
	name: string;

	@Index()
	@Property({ type: 'boolean' })
	hidden = false;

	@Index()
	@ManyToOne(() => CourseEntity, { fieldName: 'courseId' })
	course: CourseEntity;

	@ManyToOne(() => CourseGroupEntity, { fieldName: 'courseGroupId', nullable: true })
	courseGroup?: CourseGroupEntity;

	@Property()
	position: number;

	@Property()
	contents: ComponentProperties[] | [];

	@ManyToMany('Material', undefined, { fieldName: 'materialIds' })
	materials = new Collection<Material>(this);

	@OneToMany('Task', 'lesson', { orphanRemoval: true })
	tasks = new Collection<TaskStateLike>(this);

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

	private getTasksItems(): TaskStateLike[] {
		if (!this.tasks.isInitialized(true)) {
			throw new InternalServerErrorException('Lessons trying to access their tasks that are not loaded.');
		}
		const tasks = this.tasks.getItems();
		return tasks;
	}

	public getNumberOfPublishedTasks(): number {
		const tasks = this.getTasksItems();
		const filtered = tasks.filter((task) => task.isPublished());
		return filtered.length;
	}

	public getNumberOfDraftTasks(): number {
		const tasks = this.getTasksItems();
		const filtered = tasks.filter((task) => task.isDraft());
		return filtered.length;
	}

	public getNumberOfPlannedTasks(): number {
		const tasks = this.getTasksItems();
		const filtered = tasks.filter((task) => task.isPlanned());
		return filtered.length;
	}

	public getLessonComponents(): ComponentProperties[] | [] {
		return this.contents;
	}

	public getLessonLinkedTasks(): TaskStateLike[] {
		const tasks = this.getTasksItems();
		return tasks;
	}

	public getLessonMaterials(): Material[] {
		if (!this.materials.isInitialized(true)) {
			throw new InternalServerErrorException('Lessons trying to access their materials that are not loaded.');
		}
		const materials = this.materials.getItems();
		return materials;
	}

	public getSchoolId(): EntityId {
		if (!this.courseGroup) {
			return this.course.school.id;
		}

		return this.courseGroup.school.id;
	}

	public publish(): void {
		this.hidden = false;
	}

	public unpublish(): void {
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
