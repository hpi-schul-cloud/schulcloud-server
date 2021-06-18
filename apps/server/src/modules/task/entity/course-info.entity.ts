import { Collection, Entity, ManyToMany, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserInfo } from './user-info.entity';

@Entity({ tableName: 'courses' })
export class CourseInfo extends BaseEntityWithTimestamps {
	constructor(partial: Partial<CourseInfo>) {
		super();
		Object.assign(this, partial);
	}

	@Property()
	name: string;

	@Property()
	color: string;

	// TODO: @Property() ?
	@ManyToMany({ fieldName: 'userIds', type: UserInfo })
	students = new Collection<UserInfo>(this);

	// TODO: combine teachers and substitutionTeachers
	@ManyToMany({ fieldName: 'teacherIds', type: UserInfo })
	teachers = new Collection<UserInfo>(this);

	@ManyToMany({ fieldName: 'substitutionIds', type: UserInfo })
	substitutionTeachers = new Collection<UserInfo>(this);
}
