import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';

interface IStorageProviderProperties {
	endpointUrl: string;
	accessKeyId: string;
	secretAccessKey: string;
	region?: string;
}

@Entity({ tableName: 'storageproviders' })
export class StorageProvider extends BaseEntityWithTimestamps {
	@Property()
	endpointUrl!: string;

	@Property()
	accessKeyId!: string;

	@Property()
	secretAccessKey!: string;

	@Property()
	region?: string;

	constructor(props: IStorageProviderProperties) {
		super();
		this.endpointUrl = props.endpointUrl;
		this.accessKeyId = props.accessKeyId;
		this.secretAccessKey = props.secretAccessKey;
		this.region = props.region;
	}
}
