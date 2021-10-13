import { decrypt } from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';

import { Configuration } from '@hpi-schul-cloud/commons';
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';

function decryptAccessKey(secretAccessKey: string): string {
	const S3_KEY = Configuration.get('S3_KEY') as string;
	return decrypt(secretAccessKey, S3_KEY).toString(Utf8);
}
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

	get accessKey() {
		return decryptAccessKey(this.secretAccessKey);
	}

	constructor(props: IStorageProviderProperties) {
		super();
		this.endpointUrl = props.endpointUrl;
		this.accessKeyId = props.accessKeyId;
		this.secretAccessKey = props.secretAccessKey;
		this.region = props.region;
	}
}
