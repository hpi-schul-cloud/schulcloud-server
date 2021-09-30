import { Entity, Collection, ManyToMany, ManyToOne } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from './base.entity';
import type { User } from './user.entity';
import type { Course } from './course.entity';

export interface ICourseGroupProperties {
	course: Course;
	students?: User[];
}

@Entity({ tableName: 'coursegroups' })
export class CourseGroup extends BaseEntityWithTimestamps {
	@ManyToMany('User', undefined, { fieldName: 'userIds' })
	students = new Collection<User>(this);

	@ManyToOne('Course', { fieldName: 'courseId' })
	course: Course;

	constructor(props: ICourseGroupProperties) {
		super();
		this.course = props.course;
		if (props.students) this.students.set(props.students);
	}

	getParentId(): ObjectId {
		return this.course._id;
	}
}
