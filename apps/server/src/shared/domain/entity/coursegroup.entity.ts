import { Collection, Entity, Index, ManyToMany, ManyToOne } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { IEntityWithSchool } from '../interface';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';
import type { ILessonParent } from './lesson.entity';
import { School } from './school.entity';
import type { User } from './user.entity';

export interface ICourseGroupProperties {
	course: Course;
	students?: User[];
}

export interface ICourseGroupParent {
	getUserIds(): EntityId[];
}

@Entity({ tableName: 'coursegroups' })
@Index({ properties: ['school', 'course'] })
export class CourseGroup extends BaseEntityWithTimestamps implements IEntityWithSchool, ILessonParent {
	@ManyToMany('User', undefined, { fieldName: 'userIds' })
	@Index()
	students = new Collection<User>(this);

	@Index()
	@ManyToOne('Course', { fieldName: 'courseId', eager: true })
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

	getParent(): ICourseGroupParent {
		const parent = this.course;

		return parent;
	}

	getParentId(): ObjectId {
		return this.course._id;
	}

	getUserIds(): EntityId[] {
		const parent = this.getParent();
		const userIds = parent.getUserIds();

		return userIds;
	}
}
