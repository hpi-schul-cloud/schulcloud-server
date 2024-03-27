import { OptionalProps, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import type { AuthorizableObject } from '../domain-object';
import type { IEntity } from '../interface';

export abstract class BaseEntity implements IEntity, AuthorizableObject {
	@PrimaryKey()
	_id!: ObjectId;

	@SerializedPrimaryKey()
	id!: string;
}

/**
 * Describes the properties available for entities when used as @Ref
 */
export type BaseEntityReference = 'id' | '_id';

// NOTE we have to include BaseEntityWithTimestamps in the entity discovery if we inherit from BaseEntity.
// that can be cumbersome e.g. in tests. that's why we define it as a root class here.
// TODO check if we can use EntitySchema to prevent code duplication (decorators don't work for defining properties btw.)

export abstract class BaseEntityWithTimestamps<Optional = never> implements AuthorizableObject {
	[OptionalProps]?: Optional | 'createdAt' | 'updatedAt';

	@PrimaryKey()
	_id!: ObjectId;

	@SerializedPrimaryKey()
	id!: string;

	@Property({ type: Date })
	createdAt = new Date();

	@Property({ type: Date, onUpdate: () => new Date() })
	updatedAt = new Date();
}

// These fields are explicitly ignored when updating an entity. See base.do.repo.ts.
export const baseEntityProperties = ['id', '_id', 'updatedAt', 'createdAt'];
