import { BaseEntityWithTimestamps } from '@shared/domain';
// import { ValidationError } from '@shared/common';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Course } from './course.entity';
import { Coursegroup } from './coursegroup.entity';

export interface ILessonProperties {
	name: string;
	description?: string;
	hidden?: boolean;
	course?: Course;
	coursegroup?: Coursegroup;
}

@Entity({ tableName: 'lessons' })
export class Lesson extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	description: string;

	@Property()
	hidden: boolean;

	// TODO: must bundled in one parent field with target referenz
	@ManyToOne({ fieldName: 'courseId' })
	course: Course | null;

	@ManyToOne({ fieldName: 'coursegroupId' })
	coursegroup: Coursegroup | null;

	constructor(props: ILessonProperties) {
		super();
		this.name = props.name;
		this.description = props.description || '';
		this.hidden = props.hidden || true;

		const course = props.course || null;
		const coursegroup = props.coursegroup || null;

		Object.assign(this, { course, coursegroup });

		// this.validateParents();
	}

	/*
	validateParents(): void | ValidationError {
		const course = this.getCourse();
		const coursegroup = this.getCoursegroup();
		const noParent = !course && !coursegroup;
		const toManyParents = course && coursegroup;
		if (noParent || toManyParents) {
			throw new ValidationError('No parent or to many parents in lesson are defined.', { course, coursegroup });
		}
	} */

	// To eleminate handling with null.
	@Property({ persist: false })
	get parent(): Course | Coursegroup {
		const parent = (this.getCourse() || this.getCoursegroup()) as Course | Coursegroup;
		return parent;
	}

	getCourse(): Course | null {
		return this.course;
	}

	getCoursegroup(): Coursegroup | null {
		return this.coursegroup;
	}

	getParent(): Course | Coursegroup {
		return this.parent;
	}

	isVisible(): boolean {
		const isVisible = !this.hidden;
		return isVisible;
	}

	changeVisiblility(visible: boolean): void {
		this.hidden = !visible;
	}
}
