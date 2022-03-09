import { Entity, Property } from '@mikro-orm/core';
import { EncryptedStringType } from '@shared/repo/types/EncryptedString.type';
import { BaseEntityWithTimestamps } from './base.entity';

export interface IStorageProviderProperties {
	endpointUrl: string;
	accessKeyId: string;
	secretAccessKey: string;
	region?: string;
}

@Entity({ tableName: 'storageproviders' })
export class StorageProvider extends BaseEntityWithTimestamps {
	@Property()
	endpointUrl: string;

	@Property()
	accessKeyId: string;

	@Property({ fieldName: 'secretAccessKey', type: EncryptedStringType })
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
