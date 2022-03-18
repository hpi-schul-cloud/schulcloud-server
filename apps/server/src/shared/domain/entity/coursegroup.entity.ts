import { Entity, Collection, ManyToMany, ManyToOne, Index } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from './base.entity';
import type { User } from './user.entity';
import type { Course } from './course.entity';
import { School } from './school.entity';

export interface ICourseGroupProperties {
	course: Course;
	students?: User[];
}

@Entity({ tableName: 'coursegroups' })
@Index({ properties: ['school', 'course'] })
export class CourseGroup extends BaseEntityWithTimestamps {
	@ManyToMany('User', undefined, { fieldName: 'userIds' })
	@Index()
	students = new Collection<User>(this);

	@ManyToOne('Course', { fieldName: 'courseId' })
	course: Course;

	@ManyToOne('School', { fieldName: 'schoolId' })
	@Index()
	school: School;

	constructor(props: ICourseGroupProperties) {
		super();
		this.course = props.course;
		this.school = props.course.school;
		if (props.students) this.students.set(props.students);
	}

	getParentId(): ObjectId {
		return this.course._id;
	}
}
