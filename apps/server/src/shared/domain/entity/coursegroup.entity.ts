import { Entity, Property, Collection, ManyToMany } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from './base.entity';
import type { User } from './user.entity';

export interface ICourseGroupProperties {
	courseId: ObjectId;
	students?: User[];
}

@Entity({ tableName: 'coursegroups' })
export class CourseGroup extends BaseEntityWithTimestamps {
	@ManyToMany('User', undefined, { fieldName: 'userIds' })
	students = new Collection<User>(this);

	@Property()
	courseId: ObjectId;

	constructor(props: ICourseGroupProperties) {
		super();
		this.students = new Collection<User>(props.students || []);
		this.courseId = props.courseId;
		Object.assign(this, {});
	}

	getParentId(): ObjectId {
		return this.courseId;
	}
}
