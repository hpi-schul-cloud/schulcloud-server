import { Collection, Entity, Index, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
import { IEntityWithSchool } from '../interface';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';
import type { ILessonParent } from './lesson.entity';
import { SchoolEntity } from './school.entity';
import type { ITaskParent } from './task.entity';
import type { User } from './user.entity';

export interface ICourseGroupProperties {
	name: string;
	course: Course;
	students?: User[];
}

@Entity({ tableName: 'coursegroups' })
@Index({ properties: ['school', 'course'] })
export class CourseGroup extends BaseEntityWithTimestamps implements IEntityWithSchool, ITaskParent, ILessonParent {
	@Property()
	name: string;

	@ManyToMany('User', undefined, { fieldName: 'userIds' })
	@Index()
	students = new Collection<User>(this);

	@Index()
	@ManyToOne('Course', { fieldName: 'courseId' })
	course: Course;

	@ManyToOne(() => SchoolEntity, { fieldName: 'schoolId' })
	@Index()
	school: SchoolEntity;

	constructor(props: ICourseGroupProperties) {
		super();
		this.name = props.name;
		this.course = props.course;
		this.school = props.course.school;
		if (props.students) this.students.set(props.students);
	}

	public getStudentIds(): EntityId[] {
		let studentIds: EntityId[] = [];

		// A not existing course group can be referenced in a submission.
		// Therefore we need to handle this case instead of returning an error here.
		if (this.students) {
			const studentObjectIds = this.students.getIdentifiers('_id');
			studentIds = studentObjectIds.map((id): string => id.toString());
		}

		return studentIds;
	}
}
