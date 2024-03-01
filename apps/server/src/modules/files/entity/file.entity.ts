import { Embedded, Entity, Enum, Index, ManyToOne, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { StorageProviderEntity } from '@shared/domain/entity';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { v4 as uuid } from 'uuid';
import { FileOwnerModel } from '../domain';
import { FilePermissionEntity } from './file-permission.entity';
import { FileSecurityCheckEntity } from './file-security-check.entity';

export interface FileEntityProps {
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
	storageProvider?: StorageProviderEntity;
	thumbnail?: string;
	thumbnailRequestToken?: string;
	securityCheck?: FileSecurityCheckEntity;
	shareTokens?: string[];
	parentId?: EntityId;
	ownerId: EntityId;
	refOwnerModel: FileOwnerModel;
	creatorId?: EntityId;
	permissions: FilePermissionEntity[];
	lockId?: EntityId;
	versionKey?: number;
}

@Entity({ collection: 'files' })
@Index({ options: { 'permissions.refId': 1 } })
export class FileEntity extends BaseEntityWithTimestamps {
	@Property({ nullable: true })
	deletedAt?: Date;

	// you have to set the type explicitly to boolean, otherwise metadata will be wrong
	@Property({ type: 'boolean' })
	deleted = false;

	// you have to set the type explicitly to boolean, otherwise metadata will be wrong
	@Property({ type: 'boolean' })
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

	@ManyToOne(() => StorageProviderEntity, { fieldName: 'storageProviderId', nullable: true })
	storageProvider?: StorageProviderEntity; // not for directories

	@Property({ nullable: true })
	thumbnail?: string;

	@Property({ nullable: true })
	thumbnailRequestToken?: string = uuid();

	@Embedded(() => FileSecurityCheckEntity, { object: true, nullable: false })
	securityCheck: FileSecurityCheckEntity = new FileSecurityCheckEntity({});

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
	refOwnerModel: FileOwnerModel;

	@Property({ fieldName: 'creator', nullable: true })
	@Index()
	_creatorId?: ObjectId;

	get creatorId(): EntityId | undefined {
		return this._creatorId?.toHexString();
	}

	@Embedded(() => FilePermissionEntity, { array: true, nullable: false })
	permissions: FilePermissionEntity[];

	@Property({ fieldName: 'lockId', nullable: true })
	_lockId?: ObjectId;

	get lockId(): EntityId | undefined {
		return this._lockId?.toHexString();
	}

	@Property({ fieldName: '__v', nullable: true })
	versionKey?: number; // mongoose model version key

	private validate(props: FileEntityProps) {
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

	public isMarkedForDeletion(): boolean {
		return this.deleted && this.deletedAt !== undefined && !Number.isNaN(this.deletedAt.getTime());
	}

	public removeCreatorId(creatorId: EntityId): void {
		if (creatorId === this._creatorId?.toHexString()) {
			this._creatorId = undefined;
		}
	}

	constructor(props: FileEntityProps) {
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
