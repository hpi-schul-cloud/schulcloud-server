import { PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

export abstract class BaseEntityForSyncing {
	@PrimaryKey()
	_id!: ObjectId;

	@SerializedPrimaryKey()
	id!: string;

	@Property()
	createdAt = new Date();

	@Property()
	updatedAt = new Date();
}
