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

@Entity({ tableName: 'storageproviders' })
export class StorageProvider extends BaseEntityWithTimestamps {
	private static encryptionService = Configuration.has('S3_KEY')
		? new SymetricKeyEncryptionService(Configuration.get('S3_KEY'))
		: undefined;

	@Property()
	endpointUrl!: string;

	@Property()
	accessKeyId!: string;

	@Property({ fieldName: 'secretAccessKey' })
	_secretAccessKey!: string;

	@Property()
	region?: string;

	get secretAccessKey(): string {
		if (!StorageProvider.encryptionService) {
			throw new Error('Encryption service could not be created because no S3_KEY was specified.');
		}
		return StorageProvider.encryptionService.decrypt(this._secretAccessKey);
	}

	constructor(props: IStorageProviderProperties) {
		super();
		this.endpointUrl = props.endpointUrl;
		this.accessKeyId = props.accessKeyId;
		this._secretAccessKey = props.secretAccessKey;
		this.region = props.region;
	}
}
