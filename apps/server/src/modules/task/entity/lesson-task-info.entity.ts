// must deleted
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { Course } from '@src/entities';

interface LessonTaskInfoProperties {
	hidden?: boolean;
	course: Course;
}

@Entity({ tableName: 'lessons' })
export class LessonTaskInfo extends BaseEntityWithTimestamps {
	@Property()
	hidden: boolean;

	@ManyToOne({ fieldName: 'courseId' })
	course: Course;

	constructor(props: LessonTaskInfoProperties) {
		super();
		this.hidden = !!props.hidden;
		this.course = props.course;
	}
}
