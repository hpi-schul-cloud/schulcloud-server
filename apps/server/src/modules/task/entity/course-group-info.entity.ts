// file must deleted and use data from learnroom

import { Collection, Entity, ManyToMany, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserTaskInfo } from './user-task-info.entity';

interface CoursegroupInfoProperties {
	students?: UserTaskInfo[];
	courseId: ObjectId;
}

@Entity({ tableName: 'coursegroups' })
export class CourseGroupInfo extends BaseEntityWithTimestamps {
	@ManyToMany({ fieldName: 'userIds', type: UserTaskInfo })
	students = new Collection<UserTaskInfo>(this);

	@Property()
	courseId: ObjectId;

	constructor(props: CoursegroupInfoProperties) {
		super();
		this.courseId = props.courseId;

		Object.assign(this, { students: props.students });
	}
}
