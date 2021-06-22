import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';

@Entity({ tableName: 'roles' })
export class Role extends BaseEntityWithTimestamps {
	constructor(partial: Partial<Role>) {
		super();
		Object.assign(this, partial);
	}

	@Property()
	name: string;

	@Property()
	permissions: string[];
	// TODO: enum

	@Property()
	roles: EntityId[];
	// TODO: enum
}
