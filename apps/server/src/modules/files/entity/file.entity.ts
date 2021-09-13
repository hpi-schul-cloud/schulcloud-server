import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { StorageProvider } from './storageprovider.entity';

@Entity({ tableName: 'files' })
export class File extends BaseEntityWithTimestamps {
	@Property()
	deletedAt?: Date;

	@Property()
	storageFileName: string;

	@Property()
	bucket: string;

	@Property()
	isDirectory: boolean;

	@ManyToOne({ fieldName: 'storageProviderId' })
	storageProvider: StorageProvider;
}
