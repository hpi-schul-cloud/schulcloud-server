import { Collection, Entity, ManyToMany, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserTaskInfo } from './user-task-info.entity';

export const COURSE_DEFAULT_COLOR = '#ACACAC';

// TODO: This file is not used and should remove/move behind the learn room facade to get informations
@Entity({ tableName: 'courses' })
export class CourseTaskInfo extends BaseEntityWithTimestamps {
	constructor(partial: Partial<CourseTaskInfo>) {
		super();
		Object.assign(this, partial);
	}

	@Property()
	name: string;

	@Property()
	color: string = COURSE_DEFAULT_COLOR;

	// TODO: @Property() ?
	@ManyToMany({ fieldName: 'userIds', type: UserTaskInfo })
	students = new Collection<UserTaskInfo>(this);

	// TODO: combine teachers and substitutionTeachers
	@ManyToMany({ fieldName: 'teacherIds', type: UserTaskInfo })
	teachers = new Collection<UserTaskInfo>(this);

	@ManyToMany({ fieldName: 'substitutionIds', type: UserTaskInfo })
	substitutionTeachers = new Collection<UserTaskInfo>(this);
}
