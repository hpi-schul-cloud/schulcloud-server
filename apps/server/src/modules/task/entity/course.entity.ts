import { Collection, Entity, ManyToMany, Property } from '@mikro-orm/core';
import { UserInfo } from '../../news/entity';
import { BaseEntityWithTimestamps } from '@shared/domain';

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
