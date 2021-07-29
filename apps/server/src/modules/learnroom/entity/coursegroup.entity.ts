import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { Course } from './course.entity';

export interface ICoursegroupProperties {
	course: Course;
	studentIds?: EntityId[];
}

@Entity({ tableName: 'coursegroups' })
export class Coursegroup extends BaseEntityWithTimestamps {
	@Property({ fieldName: 'userIds' })
	studentIds: EntityId[];

	@ManyToOne({ fieldName: 'courseId' })
	course: Course;

	constructor(props: ICoursegroupProperties) {
		super();
		this.studentIds = props.studentIds || [];
		Object.assign(this, { course: props.course });
	}

	// isMember vs isStudent
	isStudent(userId: EntityId): boolean {
		const isStudent = this.studentIds.includes(userId);
		return isStudent;
	}
}
