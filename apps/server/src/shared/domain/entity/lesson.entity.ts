import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';

export interface ILessonProperties {
	name: string;
	hidden?: boolean;
	course: Course;
}

@Entity({ tableName: 'lessons' })
export class Lesson extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	hidden = false;

	@ManyToOne('Course', { fieldName: 'courseId' })
	course: Course;

	constructor(props: ILessonProperties) {
		super();
		this.name = props.name;
		if (props.hidden !== undefined) this.hidden = props.hidden;
		this.course = props.course;
	}
}
