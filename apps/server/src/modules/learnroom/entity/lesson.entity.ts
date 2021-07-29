import { BaseEntityWithTimestamps } from '@shared/domain';
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
	}

	getCourse(): Course | null {
		return this.course;
	}

	getCoursegroup(): Coursegroup | null {
		return this.coursegroup;
	}

	isVisible(): boolean {
		const isVisible = !this.hidden;
		return isVisible;
	}
}
