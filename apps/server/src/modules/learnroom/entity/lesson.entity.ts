import { BaseEntityWithTimestamps } from '@shared/domain';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Course } from './course.entity';

export interface ILessonProperties {
	name: string;
	description?: string;
	hidden?: boolean;
	course: Course;
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
	course: Course; // check null

	// courseGroupId

	constructor(props: ILessonProperties) {
		super();
		this.name = props.name;
		this.description = props.description || '';
		this.hidden = props.hidden || true;

		Object.assign(this, { course: props.course });
	}
}
