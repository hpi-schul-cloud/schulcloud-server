import { Embeddable, Embedded, Entity, Enum, Index, ManyToOne, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { v4 as uuid } from 'uuid';

import { EntityId } from '@shared/domain';
import { BaseEntityWithTimestamps } from './base.entity';
import { StorageProvider } from './storageprovider.entity';
import { User } from './user.entity';

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
	shareTokens?: string[];
	parent?: File;
	ownerId: EntityId | ObjectId;
	refOwnerModel: FileRefOwnerModel;
	creator?: User;
	lockId?: User;
}

@Entity({ collection: 'files' })
@Index({ properties: ['shareTokens'] })
export class File extends BaseEntityWithTimestamps {
	constructor(props: FileProps) {
		super();
		this.validate(props);

		this.deletedAt = props.deletedAt;
		this.isDirectory = props.isDirectory || false;
		this.name = props.name;
		this.size = props.size;
		this.type = props.type;
		this.storageFileName = props.storageFileName;
		this.bucket = props.bucket;
		this.storageProvider = props.storageProvider;
		this.thumbnail = props.thumbnail;
		this.thumbnailRequestToken = props.thumbnailRequestToken;
		this.securityCheck = new SecurityCheck({});
		this.shareTokens = props.shareTokens;
		this.parent = props.parent;
		this._ownerId = new ObjectId(props.ownerId);
		this.refOwnerModel = props.refOwnerModel;
		this.creator = props.creator;
		this.lockId = props.lockId;
	}

	private validate(props: FileProps) {
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
	size?: number;

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
	thumbnailRequestToken?: string;

	@Embedded(() => SecurityCheck, { object: true, nullable: false })
	securityCheck: SecurityCheck;

	@Property({ nullable: true })
	shareTokens?: string[];

	@ManyToOne({ nullable: true })
	parent?: File;

	@Property({ fieldName: 'owner', nullable: false })
	_ownerId: ObjectId;

	get ownerId(): EntityId {
		return this._ownerId.toHexString();
	}

	@Enum({ nullable: false })
	refOwnerModel: FileRefOwnerModel;

	@ManyToOne('User', { nullable: true })
	creator?: User;

	@ManyToOne({ nullable: true })
	lockId?: User;
}
