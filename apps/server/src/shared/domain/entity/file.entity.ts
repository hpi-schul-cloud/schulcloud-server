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

export const enum RefPermModel {
	USER = 'user',
	ROLE = 'role',
}

export interface FilePermissionProps {
	refId: EntityId;
	refPermModel: RefPermModel;
	write?: boolean;
	read?: boolean;
	create?: boolean;
	delete?: boolean;
}

@Embeddable()
export class FilePermission {
	@Property({ nullable: false })
	refId: ObjectId;

	@Enum({ nullable: false })
	refPermModel: RefPermModel;

	@Property()
	write = true;

	@Property()
	read = true;

	@Property()
	create = true;

	@Property()
	delete = true;

	constructor(props: FilePermissionProps) {
		this.refId = new ObjectId(props.refId);
		this.refPermModel = props.refPermModel;

		if (props.write !== undefined) {
			this.write = props.write;
		}

		if (props.read !== undefined) {
			this.read = props.read;
		}

		if (props.create !== undefined) {
			this.create = props.create;
		}

		if (props.delete !== undefined) {
			this.delete = props.delete;
		}
	}
}

export interface FileProps {
	createdAt?: Date;
	updatedAt?: Date;
	deletedAt?: Date;
	deleted?: boolean;
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
	permissions: FilePermission[];
	lockId?: EntityId;
	versionKey?: number;
}

@Entity({ collection: 'files' })
@Index({ options: { 'permissions.refId': 1 } })
export class File extends BaseEntityWithTimestamps {
	@Property({ nullable: true })
	deletedAt?: Date;

	@Property()
	deleted = false;

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

	@Property({ nullable: true })
	@Index()
	shareTokens: string[] = [];

	@Property({ fieldName: 'parent', nullable: true })
	@Index()
	_parentId?: ObjectId;

	get parentId(): EntityId | undefined {
		return this._parentId?.toHexString();
	}

	@Property({ fieldName: 'owner', nullable: false })
	@Index()
	_ownerId: ObjectId;

	get ownerId(): EntityId {
		return this._ownerId.toHexString();
	}

	@Enum({ nullable: false })
	refOwnerModel: FileRefOwnerModel;

	@Property({ fieldName: 'creator' })
	@Index()
	_creatorId: ObjectId;

	get creatorId(): EntityId {
		return this._creatorId.toHexString();
	}

	@Embedded(() => FilePermission, { array: true, nullable: false })
	permissions: FilePermission[];

	@Property({ fieldName: 'lockId', nullable: true })
	_lockId?: ObjectId;

	get lockId(): EntityId | undefined {
		return this._lockId?.toHexString();
	}

	@Property({ fieldName: '__v', nullable: true })
	versionKey?: number; // mongoose model version key

	private validate(props: FileProps) {
		if (props.isDirectory) return;

		if (!props.size || !props.storageFileName || !props.bucket || !props.storageProvider) {
			throw new Error(
				'files that are not directories always need a size, a storage file name, a bucket, and a storage provider.'
			);
		}
	}

	public removePermissionsByRefId(refId: EntityId): void {
		const refObjectId = new ObjectId(refId);

		this.permissions = this.permissions.filter((permission) => !permission.refId.equals(refObjectId));
	}

	public markForDeletion(): void {
		this.deletedAt = new Date();
		this.deleted = true;
	}

	constructor(props: FileProps) {
		super();

		this.validate(props);

		if (props.createdAt !== undefined) {
			this.createdAt = props.createdAt;
		}

		if (props.updatedAt !== undefined) {
			this.updatedAt = props.updatedAt;
		}

		this.deletedAt = props.deletedAt;

		if (props.deleted !== undefined) {
			this.deleted = props.deleted;
		}

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
		this.permissions = props.permissions;

		if (props.lockId !== undefined) {
			this._lockId = new ObjectId(props.lockId);
		}

		if (props.versionKey !== undefined) {
			this.versionKey = props.versionKey;
		}
	}
}
