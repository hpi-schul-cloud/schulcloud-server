import { Entity, ManyToOne, Property, Index } from '@mikro-orm/core';
import { ILearnroomElement } from '@shared/domain/interface';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';

export interface ILessonProperties {
	name: string;
	hidden?: boolean;
	course: Course;
}

@Entity({ tableName: 'lessons' })
export class Lesson extends BaseEntityWithTimestamps implements ILearnroomElement {
	@Property()
	name: string;

	@Index({ name: 'findAllByCourseIds' })
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

	publish() {
		this.hidden = false;
	}

	unpublish() {
		this.hidden = true;
	}
}
