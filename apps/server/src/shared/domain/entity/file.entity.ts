import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import type { StorageProvider } from './storageprovider.entity';
import type { User } from './user.entity';

export interface IFileProperties {
	deletedAt?: Date;
	storageFileName: string;
	bucket: string;
	storageProvider: StorageProvider;
	creator?: User;
}

@Entity({ collection: 'files', discriminatorColumn: 'isDirectory', abstract: true })
export abstract class BaseFile extends BaseEntityWithTimestamps {
	@Property()
	deletedAt?: Date;

	@Property()
	isDirectory!: boolean;

	@ManyToOne('User')
	creator?: User;
}

@Entity({ collection: 'files', discriminatorValue: 'true' })
export class Directory extends BaseFile {}

@Entity({ collection: 'files', discriminatorValue: 'false' })
export class File extends BaseFile {
	@Property()
	storageFileName: string;

	@Property()
	bucket: string;

	@ManyToOne('StorageProvider', { fieldName: 'storageProviderId' })
	storageProvider: StorageProvider;

	constructor(props: IFileProperties) {
		super();
		this.isDirectory = false;
		this.deletedAt = props.deletedAt;
		this.storageFileName = props.storageFileName;
		this.bucket = props.bucket;
		this.storageProvider = props.storageProvider;
		this.creator = props.creator;
	}
}
