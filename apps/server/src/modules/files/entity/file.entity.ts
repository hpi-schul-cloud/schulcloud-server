import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { StorageProvider } from './storageprovider.entity';

interface IFileProperties {
	deletedAt?: Date;
	storageFileName?: string;
	bucket?: string;
	isDirectory: boolean;
	storageProvider?: StorageProvider;
}

@Entity({ tableName: 'files' })
export class File extends BaseEntityWithTimestamps {
	@Property()
	deletedAt?: Date;

	@Property()
	storageFileName?: string;

	@Property()
	bucket?: string;

	@Property()
	isDirectory: boolean;

	@ManyToOne({ fieldName: 'storageProviderId' })
	storageProvider?: StorageProvider;

	constructor(props: IFileProperties) {
		super();
		this.deletedAt = props.deletedAt;
		this.storageFileName = props.storageFileName;
		this.bucket = props.bucket;
		this.isDirectory = props.isDirectory;
		this.storageProvider = props.storageProvider;
	}
}
