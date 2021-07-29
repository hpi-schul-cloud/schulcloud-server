import { Entity, ManyToOne, Property } from '@mikro-orm/core';

import { BaseEntityWithTimestamps } from '@shared/domain';
import { ValidationError } from '@shared/common';

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

	@ManyToOne({ fieldName: 'courseId' })
	course: Course;

	@ManyToOne({ fieldName: 'coursegroupId' })
	coursegroup: Coursegroup | null;

	constructor(props: ILessonProperties) {
		super();
		this.name = props.name;
		this.description = props.description || '';
		this.hidden = props.hidden || true;

		let course = props.course || null;
		const coursegroup = props.coursegroup || null;

		if (course === null && coursegroup !== null) {
			course = coursegroup.course;
		}

		Object.assign(this, { course, coursegroup });

		this.validateCourse();
	}

	validateCourse(): void | ValidationError {
		const { course, coursegroup } = this;
		if (course === null) {
			throw new ValidationError('Course in lesson must exist.');
		}

		if (coursegroup !== null && !(typeof coursegroup.course === 'object')) {
			throw new ValidationError('The added coursegroup in lesson do not include valid course.', { coursegroup });
		}

		if (coursegroup !== null && coursegroup.course.id !== course.id) {
			throw new ValidationError('Coursegroup must be a part of course in lesson.', { course, coursegroup });
		}
	}

	getCourse(): Course | null {
		return this.course;
	}

	getCoursegroup(): Coursegroup | null {
		return this.coursegroup;
	}

	@Property({ persist: false })
	get parent(): Course | Coursegroup {
		const parent = this.getCoursegroup() !== null ? this.getCoursegroup() : this.getCourse();
		return parent as Course | Coursegroup;
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
