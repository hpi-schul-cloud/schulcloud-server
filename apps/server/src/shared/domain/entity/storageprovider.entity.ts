import { Configuration } from '@hpi-schul-cloud/commons';
import { Entity, Property } from '@mikro-orm/core';
import { SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { BaseEntityWithTimestamps } from './base.entity';

interface IStorageProviderProperties {
	endpointUrl: string;
	accessKeyId: string;
	secretAccessKey: string;
	region?: string;
}

const encryptionService = new SymetricKeyEncryptionService(Configuration.get('S3_KEY'));

@Entity({ tableName: 'storageproviders' })
export class StorageProvider extends BaseEntityWithTimestamps {
	@Property()
	endpointUrl!: string;

	@Property()
	accessKeyId!: string;

	@Property({ fieldName: 'secretAccessKey' })
	_secretAccessKey!: string;

	@Property()
	region?: string;

	get secretAccessKey(): string {
		return encryptionService.decrypt(this._secretAccessKey);
	}

	constructor(props: IStorageProviderProperties) {
		super();
		this.endpointUrl = props.endpointUrl;
		this.accessKeyId = props.accessKeyId;
		this._secretAccessKey = props.secretAccessKey;
		this.region = props.region;
	}
}
