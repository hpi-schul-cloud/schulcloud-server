import { Collection, Entity, ManyToMany, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserTaskInfo } from './user-task-info.entity';

@Entity({ tableName: 'courses' })
export class CourseTaskInfo extends BaseEntityWithTimestamps {
	constructor(partial: Partial<CourseTaskInfo>) {
		super();
		Object.assign(this, partial);
	}

	@Property()
	name: string;

	@Property()
	color: string;

	// TODO: we do not use any populate of it ManyToMany is not related at the moment
	@ManyToMany({ fieldName: 'userIds', type: UserTaskInfo })
	students = new Collection<UserTaskInfo>(this);

	// TODO: combine teachers and substitutionTeachers
	@ManyToMany({ fieldName: 'teacherIds', type: UserTaskInfo })
	teachers = new Collection<UserTaskInfo>(this);

	@ManyToMany({ fieldName: 'substitutionIds', type: UserTaskInfo })
	substitutionTeachers = new Collection<UserTaskInfo>(this);
}
