import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';

@Entity({ tableName: 'files' })
export class File extends BaseEntityWithTimestamps {
	@Property()
	deletedAt?: Date;

	@Property()
	storageFileName?: string;

	@Property()
	bucketId?: string;

	@Property()
	isDirectory: boolean;
}
