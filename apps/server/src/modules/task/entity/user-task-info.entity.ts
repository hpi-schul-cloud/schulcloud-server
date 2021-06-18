import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '@shared/domain';

@Entity({ tableName: 'users' })
export class UserTaskInfo extends BaseEntity {
	@Property()
	firstName!: string;

	@Property()
	lastName!: string;

	constructor(partial: Partial<UserTaskInfo>) {
		super();
		Object.assign(this, partial);
	}
}
