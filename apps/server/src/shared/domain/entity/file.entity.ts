import { Embeddable, Embedded, Entity, Enum, Index, ManyToOne, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { v4 as uuid } from 'uuid';

import { EntityId } from '@shared/domain';
import { BaseEntityWithTimestamps } from './base.entity';
import { StorageProvider } from './storageprovider.entity';

export const enum SecurityCheckScanStatus {
	PENDING = 'pending',
	VERIFIED = 'verified',
	BLOCKED = 'blocked',
	WONT_CHECK = 'wont-check',
}

export interface SecurityCheckProps {
	status?: SecurityCheckScanStatus;
	reason?: string;
	requestToken?: string;
}

@Embeddable()
export class SecurityCheck {
	@Enum()
	status: SecurityCheckScanStatus = SecurityCheckScanStatus.PENDING;

	@Property()
	reason = 'not yet scanned';

	@Property()
	requestToken?: string = uuid();

	@Property()
	createdAt = new Date();

	@Property()
	updatedAt = new Date();

	constructor(props: SecurityCheckProps) {
		if (props.status !== undefined) {
			this.status = props.status;
		}

		if (props.reason !== undefined) {
			this.reason = props.reason;
		}

		if (props.requestToken !== undefined) {
			this.requestToken = props.requestToken;
		}
	}
}

export const enum FileRefOwnerModel {
	USER = 'user',
	COURSE = 'course',
	TEAMS = 'teams',
}

export interface FileProps {
	deletedAt?: Date;
	isDirectory?: boolean;
	name: string;
	size?: number;
	type?: string;
	storageFileName?: string;
	bucket?: string;
	storageProvider?: StorageProvider;
	thumbnail?: string;
	thumbnailRequestToken?: string;
	securityCheck?: SecurityCheck;
	shareTokens?: string[];
	parentId?: EntityId;
	ownerId: EntityId;
	refOwnerModel: FileRefOwnerModel;
	creatorId: EntityId;
	lockId?: EntityId;
}

@Entity({ collection: 'files' })
export class File extends BaseEntityWithTimestamps {
	@Property({ nullable: true })
	deletedAt?: Date;

	@Property()
	isDirectory = false;

	@Property()
	name: string;

	@Property({ nullable: true })
	size?: number; // not for directories

	@Property({ nullable: true })
	type?: string;

	@Property({ nullable: true })
	storageFileName?: string; // not for directories

	@Property({ nullable: true })
	bucket?: string; // not for directories

	@ManyToOne('StorageProvider', { fieldName: 'storageProviderId', nullable: true })
	storageProvider?: StorageProvider; // not for directories

	@Property({ nullable: true })
	thumbnail?: string;

	@Property({ nullable: true })
	thumbnailRequestToken?: string = uuid();

	@Embedded(() => SecurityCheck, { object: true, nullable: false })
	securityCheck: SecurityCheck = new SecurityCheck({});

	@Index()
	@Property({ nullable: true })
	shareTokens?: string[];

	@Index()
	@Property({ fieldName: 'parent', nullable: true })
	_parentId?: ObjectId;

	get parentId(): EntityId | undefined {
		return this._parentId?.toHexString();
	}

	@Index()
	@Property({ fieldName: 'owner', nullable: false })
	_ownerId: ObjectId;

	get ownerId(): EntityId {
		return this._ownerId.toHexString();
	}

	@Enum({ nullable: false })
	refOwnerModel: FileRefOwnerModel;

	@Index()
	@Property({ fieldName: 'creator' })
	_creatorId: ObjectId;

	get creatorId(): EntityId {
		return this._creatorId.toHexString();
	}

	@Property({ fieldName: 'lockId', nullable: true })
	_lockId?: ObjectId;

	get lockId(): EntityId | undefined {
		return this._lockId?.toHexString();
	}

	private validate(props: FileProps) {
		if (props.isDirectory) return;

		if (!props.size || !props.storageFileName || !props.bucket || !props.storageProvider) {
			throw new Error(
				'files that are not directories always need a size, a storage file name, a bucket, and a storage provider.'
			);
		}
	}

	constructor(props: FileProps) {
		super();

		this.validate(props);

		this.deletedAt = props.deletedAt;

		if (props.isDirectory !== undefined) {
			this.isDirectory = props.isDirectory;
		}

		this.name = props.name;
		this.size = props.size;
		this.type = props.type;
		this.storageFileName = props.storageFileName;
		this.bucket = props.bucket;
		this.storageProvider = props.storageProvider;
		this.thumbnail = props.thumbnail;

		if (props.thumbnailRequestToken !== undefined) {
			this.thumbnailRequestToken = props.thumbnailRequestToken;
		}

		if (props.securityCheck !== undefined) {
			this.securityCheck = props.securityCheck;
		}

		if (props.shareTokens !== undefined) {
			this.shareTokens = props.shareTokens;
		}

		if (props.parentId !== undefined) {
			this._parentId = new ObjectId(props.parentId);
		}

		this._ownerId = new ObjectId(props.ownerId);
		this.refOwnerModel = props.refOwnerModel;
		this._creatorId = new ObjectId(props.creatorId);

		if (props.lockId !== undefined) {
			this._lockId = new ObjectId(props.lockId);
		}
	}
}
