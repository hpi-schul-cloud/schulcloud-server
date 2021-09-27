import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';

@Entity({ tableName: 'storageproviders' })
export class StorageProvider extends BaseEntityWithTimestamps {
	@Property()
	endpointUrl!: string;

	@Property()
	accessKeyId!: string;

	@Property()
	secretAccessKey!: string;

	@Property()
	region: string;
}
