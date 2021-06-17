import { Collection, Entity, ManyToMany, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserInfo } from '../../news/entity';

@Entity({ tableName: 'courses' })
export class Course extends BaseEntityWithTimestamps {
	constructor(partial: Partial<Course>) {
		super();
		Object.assign(this, partial);
	}

	@Property()
	name: string;

	@Property()
	color: string;

	@ManyToMany({ fieldName: 'userIds', type: UserInfo })
	students = new Collection<UserInfo>(this);
}
