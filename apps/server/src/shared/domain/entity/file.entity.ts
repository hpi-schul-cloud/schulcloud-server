import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import type { StorageProvider } from './storageprovider.entity';

interface IFileProperties {
	deletedAt?: Date;
	storageFileName: string;
	bucket: string;
	storageProvider: StorageProvider;
}

@Entity({ tableName: 'files', discriminatorColumn: 'isDirectory' })
export class BaseFile extends BaseEntityWithTimestamps {
	@Property()
	deletedAt?: Date;

	@Property()
	isDirectory: boolean;
}

@Entity({ discriminatorValue: 'true' })
export class Directory extends BaseFile {}

@Entity({ discriminatorValue: 'false' })
export class File extends BaseFile {
	@Property()
	storageFileName: string;

	@Property()
	bucket: string;

	@ManyToOne({ fieldName: 'storageProviderId' })
	storageProvider: StorageProvider;

	constructor(props: IFileProperties) {
		super();
		this.isDirectory = false;
		this.deletedAt = props.deletedAt;
		this.storageFileName = props.storageFileName;
		this.bucket = props.bucket;
		this.storageProvider = props.storageProvider;
	}
}
