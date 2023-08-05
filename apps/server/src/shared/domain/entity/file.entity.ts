import { Entity, Enum, Index, ManyToOne, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

import { EntityId } from '@shared/domain';

import { BaseEntityWithTimestamps } from './base.entity';
import { StorageProvider } from './storageprovider.entity';
import { User } from './user.entity';

export interface IFileProperties {
	deletedAt?: Date;
	storageFileName?: string;
	bucket?: string;
	storageProvider?: StorageProvider;
	creator?: User;
	name: string;
	isDirectory?: boolean;
	ownerId: EntityId | ObjectId;
	refOwnerModel: FileRefOwnerModel;
}

export const enum FileRefOwnerModel {
	USER = 'user',
	COURSE = 'course',
	TEAMS = 'teams',
}

@Entity({ collection: 'files' })
@Index({ properties: ['shareTokens'] })
export class File extends BaseEntityWithTimestamps {
	constructor(props: IFileProperties) {
		super();
		this.validate(props);

		this.isDirectory = props.isDirectory || false;
		this.deletedAt = props.deletedAt;
		this.storageFileName = props.storageFileName;
		this.bucket = props.bucket;
		this.storageProvider = props.storageProvider;
		this.creator = props.creator;
		this.name = props.name;
		this._ownerId = new ObjectId(props.ownerId);
		this.refOwnerModel = props.refOwnerModel;
	}

	private validate(props: IFileProperties) {
		if (props.isDirectory) return;
		if (!props.bucket || !props.storageFileName || !props.storageProvider) {
			throw new Error('files that are not directories always need a bucket, a storageFilename, and a storageProvider.');
		}
	}

	@Property({ nullable: true })
	deletedAt?: Date;

	@Property()
	isDirectory: boolean;

	@Property()
	name: string;

	@Property({ nullable: true })
	shareTokens?: string[];

	@ManyToOne('User', { nullable: true })
	creator?: User;

	@Property({ nullable: true })
	storageFileName?: string; // not for directories

	@Property({ nullable: true })
	bucket?: string; // not for directories

	@ManyToOne('StorageProvider', { fieldName: 'storageProviderId', nullable: true })
	storageProvider?: StorageProvider; // not for directories

	@Property({ fieldName: 'owner', nullable: false })
	_ownerId: ObjectId;

	get ownerId(): EntityId {
		return this._ownerId.toHexString();
	}

	@Enum({ nullable: false })
	refOwnerModel: FileRefOwnerModel;
}
