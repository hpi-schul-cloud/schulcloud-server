import { Collection, Entity, Index, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
import { IEntityWithSchool } from '../interface';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';
import { School } from './school.entity';
import type { User } from './user.entity';

export interface ICourseGroupProperties {
	name: string;
	course: Course;
	students?: User[];
}

@Entity({ tableName: 'coursegroups' })
@Index({ properties: ['school', 'course'] })
export class CourseGroup extends BaseEntityWithTimestamps implements IEntityWithSchool {
	@Property()
	name: string;

	@ManyToMany('User', undefined, { fieldName: 'userIds' })
	@Index()
	students = new Collection<User>(this);

	@Index()
	@ManyToOne('Course', { fieldName: 'courseId' })
	course: Course;

	@ManyToOne('School', { fieldName: 'schoolId' })
	@Index()
	school: School;

	constructor(props: ICourseGroupProperties) {
		super();
		this.name = props.name;
		this.course = props.course;
		this.school = props.course.school;
		if (props.students) this.students.set(props.students);
	}

	// TODO: test
	public getStudentIds(): EntityId[] {
		if (this.students === undefined) {
			throw new Error('Coursegroup.students is undefined. The coursegroup need to be populated.');
		}
		const studentObjectIds = this.students.getIdentifiers('_id');
		const studentIds = studentObjectIds.map((id) => id.toString());

		return studentIds;
	}
}
