import { Collection, Entity, ManyToMany, ManyToOne } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '../../../shared/domain';
import { CourseTaskInfo } from './course-task-info.entity';
import { UserTaskInfo } from './user-task-info.entity';

@Entity({ tableName: 'coursegroups' })
export class CourseGroupInfo extends BaseEntityWithTimestamps {
	constructor(partial: Partial<CourseGroupInfo>) {
		super();
		Object.assign(this, partial);
	}

	@ManyToMany({ fieldName: 'userIds', type: UserTaskInfo })
	students = new Collection<UserTaskInfo>(this);

	@ManyToOne({ fieldName: 'courseId' })
	course: CourseTaskInfo;
}
