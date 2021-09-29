import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';

interface LessonProperties {
	hidden?: boolean;
	course: Course;
}

@Entity({ tableName: 'lessons' })
export class Lesson extends BaseEntityWithTimestamps {
	@Property()
	hidden = false;

	@ManyToOne('Course', { fieldName: 'courseId' })
	course: Course;

	constructor(props: LessonProperties) {
		super();
		if (props.hidden !== undefined) this.hidden = props.hidden;
		this.course = props.course;
	}
}
