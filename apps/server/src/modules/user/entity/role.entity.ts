import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';

@Entity({ tableName: 'roles' })
export class Role extends BaseEntityWithTimestamps {
	constructor(partial: Partial<Role>) {
		super();
		// TODO not use partial see INewsProperties, use Object.assign for related entities only.
		Object.assign(this, partial);
	}

	@Property()
	name: string;

	@Property()
	permissions: string[];
	// TODO: enum

	@Property()
	roles: EntityId[];
	// TODO add meaning, parentRoles, roles to extend permissions from...?
	// TODO: enum / Role self-reference
}
