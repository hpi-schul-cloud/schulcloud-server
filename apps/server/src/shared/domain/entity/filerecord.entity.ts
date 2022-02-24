import { Entity, Enum, Property, Index, Embeddable, Embedded } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from './base.entity';
import type { EntityId } from '../types/entity-id';

export enum FileSecurityCheckStatus {
	PENDING = 'pending',
	VERIFIED = 'verified',
	BLOCKED = 'blocked',
	WONTCHECK = 'wont-check',
}

export enum FileRecordTargetType {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'Team' = 'teams',
	'DashboardModel' = 'dashboard', // without s
	'Task' = 'tasks',
	// card
}
export interface IFileSecurityCheckProperties {
	status?: FileSecurityCheckStatus;
	reason?: string;
	requestToken?: string;
}
@Embeddable()
export class FileSecurityCheck {
	@Enum()
	status: FileSecurityCheckStatus = FileSecurityCheckStatus.PENDING;

	@Property()
	reason = 'not yet scanned';

	@Property()
	requestToken: string = uuid();

	@Property()
	createdAt = new Date();

	@Property({ onUpdate: () => new Date() })
	updatedAt = new Date();

	constructor(props: IFileSecurityCheckProperties) {
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

export interface IFileRecordProperties {
	size: number;
	name: string;
	type: string; // TODO mime-type enum?
	securityCheck?: FileSecurityCheck;
	targetType: FileRecordTargetType;
	targetId: EntityId | ObjectId;
	creatorId: EntityId | ObjectId;
	lockedForUserId?: EntityId | ObjectId;
	schoolId: EntityId | ObjectId;
}

/**
 * Note: The file record entity will not manage any entity relations by itself.
 * That's why we do not map any relations in the entity class
 * and instead just use the plain object ids.
 */
@Entity({ tableName: 'filerecord' })
@Index({ properties: ['_schoolId', '_targetId'] })
export class FileRecord extends BaseEntityWithTimestamps {
	@Property()
	size: number;

	@Property()
	name: string;

	@Property()
	type: string; // TODO mime-type enum?

	@Embedded(() => FileSecurityCheck, { object: true, nullable: true })
	securityCheck?: FileSecurityCheck;

	@Enum()
	targetType: FileRecordTargetType;

	@Property({ fieldName: 'target' })
	_targetId: ObjectId;

	get targetId(): EntityId {
		return this._targetId.toHexString();
	}

	@Property({ fieldName: 'creator' })
	_creatorId: ObjectId;

	get creatorId(): EntityId {
		return this._creatorId.toHexString();
	}

	// todo: permissions

	// for wopi, is this still needed?
	@Property({ fieldName: 'lockedForUser' })
	_lockedForUserId?: ObjectId;

	get lockedForUserId(): EntityId | undefined {
		return this._lockedForUserId?.toHexString();
	}

	@Property({ fieldName: 'school' })
	_schoolId: ObjectId;

	get schoolId(): EntityId {
		return this._schoolId?.toHexString();
	}

	constructor(props: IFileRecordProperties) {
		super();
		this.size = props.size;
		this.name = props.name;
		this.type = props.type;
		this.securityCheck = props.securityCheck;
		this.targetType = props.targetType;
		this._targetId = new ObjectId(props.targetId);
		this._creatorId = new ObjectId(props.creatorId);
		if (props.lockedForUserId !== undefined) {
			this._lockedForUserId = new ObjectId(props.lockedForUserId);
		}
		this._schoolId = new ObjectId(props.schoolId);
	}

	updateSecurityCheckStatus(status: FileSecurityCheckStatus, reason: string): void {
		if (!this.securityCheck) {
			this.securityCheck = new FileSecurityCheck({ status, reason });
		} else {
			this.securityCheck.status = status;
			this.securityCheck.reason = reason;
		}
	}
}
