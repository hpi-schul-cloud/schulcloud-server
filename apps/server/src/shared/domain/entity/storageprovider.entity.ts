import { Entity, Property } from '@mikro-orm/core';
import { StorageProviderEncryptedStringType } from '@shared/repo/types/StorageProviderEncryptedString.type';
import { BaseEntityWithTimestamps } from './base.entity';

export interface IStorageProviderProperties {
	endpointUrl: string;
	accessKeyId: string;
	secretAccessKey: string;
	region?: string;
}

@Entity({ tableName: 'storageproviders' })
export class StorageProviderEntity extends BaseEntityWithTimestamps {
	@Property()
	endpointUrl: string;

	@Property()
	accessKeyId: string;

	@Property({ fieldName: 'secretAccessKey', type: StorageProviderEncryptedStringType })
	secretAccessKey: string;

	@Property({ nullable: true })
	region?: string;

	constructor(props: IStorageProviderProperties) {
		super();
		this.endpointUrl = props.endpointUrl;
		this.accessKeyId = props.accessKeyId;
		this.secretAccessKey = props.secretAccessKey;
		this.region = props.region;
	}
}
