import { Embeddable, Embedded, Entity, Enum, Index, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException } from '@nestjs/common';
import { BaseEntityWithTimestamps, type EntityId } from '@shared/domain';
import { v4 as uuid } from 'uuid';
import { ErrorType } from '../error';
import { PreviewInputMimeTypes } from '../interface/preview-input-mime-types.enum';

export enum ScanStatus {
	PENDING = 'pending',
	VERIFIED = 'verified',
	BLOCKED = 'blocked',
	ERROR = 'error',
}

export enum FileRecordParentType {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'Task' = 'tasks',
	'Lesson' = 'lessons',
	'Submission' = 'submissions',
	'BoardNode' = 'boardnodes',
}

export enum PreviewStatus {
	PREVIEW_POSSIBLE = 'preview_possible',
	AWAITING_SCAN_STATUS = 'awaiting_scan_status',
	PREVIEW_NOT_POSSIBLE_SCAN_STATUS_ERROR = 'preview_not_possible_scan_status_error',
	PREVIEW_NOT_POSSIBLE_SCAN_STATUS_BLOCKED = 'preview_not_possible_scan_status_blocked',
	PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE = 'preview_not_possible_wrong_mime_type',
}

export interface IFileSecurityCheckProperties {
	status?: ScanStatus;
	reason?: string;
	requestToken?: string;
}
@Embeddable()
export class FileSecurityCheck {
	@Enum()
	status: ScanStatus = ScanStatus.PENDING;

	@Property()
	reason = 'not yet scanned';

	@Property()
	requestToken?: string = uuid();

	@Property()
	createdAt = new Date();

	@Property()
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
	mimeType: string;
	parentType: FileRecordParentType;
	parentId: EntityId;
	creatorId: EntityId;
	schoolId: EntityId;
	deletedSince?: Date;
	isCopyFrom?: EntityId;
}

interface IParentInfo {
	schoolId: EntityId;
	parentId: EntityId;
	parentType: FileRecordParentType;
}

// TODO: IEntityWithSchool

/**
 * Note: The file record entity will not manage any entity relations by itself.
 * That's why we do not map any relations in the entity class
 * and instead just use the plain object ids.
 */
@Entity({ tableName: 'filerecords' })
@Index({ properties: ['_schoolId', '_parentId'], options: { background: true } })
// https://github.com/mikro-orm/mikro-orm/issues/1230
@Index({ options: { 'securityCheck.requestToken': 1 } })
export class FileRecord extends BaseEntityWithTimestamps {
	@Index({ options: { expireAfterSeconds: 7 * 24 * 60 * 60 } })
	@Property({ nullable: true })
	deletedSince?: Date;

	@Property()
	size: number;

	@Property()
	name: string;

	@Property()
	mimeType: string; // TODO mime-type enum?

	@Embedded(() => FileSecurityCheck, { object: true, nullable: false })
	securityCheck: FileSecurityCheck;

	@Index()
	@Enum()
	parentType: FileRecordParentType;

	@Index()
	@Property({ fieldName: 'parent' })
	_parentId: ObjectId;

	get parentId(): EntityId {
		return this._parentId.toHexString();
	}

	@Property({ fieldName: 'creator' })
	_creatorId: ObjectId;

	get creatorId(): EntityId {
		return this._creatorId.toHexString();
	}

	@Property({ fieldName: 'school' })
	_schoolId: ObjectId;

	get schoolId(): EntityId {
		return this._schoolId.toHexString();
	}

	@Property({ fieldName: 'isCopyFrom', nullable: true })
	_isCopyFrom?: ObjectId;

	get isCopyFrom(): EntityId | undefined {
		const result = this._isCopyFrom?.toHexString();

		return result;
	}

	constructor(props: IFileRecordProperties) {
		super();
		this.size = props.size;
		this.name = props.name;
		this.mimeType = props.mimeType;
		this.parentType = props.parentType;
		this._parentId = new ObjectId(props.parentId);
		this._creatorId = new ObjectId(props.creatorId);
		this._schoolId = new ObjectId(props.schoolId);
		if (props.isCopyFrom) {
			this._isCopyFrom = new ObjectId(props.isCopyFrom);
		}
		this.securityCheck = new FileSecurityCheck({});
		this.deletedSince = props.deletedSince;
	}

	public updateSecurityCheckStatus(status: ScanStatus, reason: string): void {
		this.securityCheck.status = status;
		this.securityCheck.reason = reason;
		this.securityCheck.updatedAt = new Date();
		this.securityCheck.requestToken = undefined;
	}

	public getSecurityToken(): string | undefined {
		return this.securityCheck.requestToken;
	}

	public copy(userId: EntityId, targetParentInfo: IParentInfo): FileRecord {
		const { size, name, mimeType, id } = this;
		const { parentType, parentId, schoolId } = targetParentInfo;

		const fileRecordCopy = new FileRecord({
			size,
			name,
			mimeType,
			parentType,
			parentId,
			creatorId: userId,
			schoolId,
			isCopyFrom: id,
		});

		if (this.isVerified()) {
			fileRecordCopy.securityCheck = this.securityCheck;
		}

		return fileRecordCopy;
	}

	public markForDelete(): void {
		this.deletedSince = new Date();
	}

	public unmarkForDelete(): void {
		this.deletedSince = undefined;
	}

	public setName(name: string): void {
		if (name.length === 0) {
			throw new BadRequestException(ErrorType.FILE_NAME_EMPTY);
		}

		this.name = name;
	}

	public hasName(name: string): boolean {
		const hasName = this.name === name;

		return hasName;
	}

	public getName(): string {
		return this.name;
	}

	public isBlocked(): boolean {
		const isBlocked = this.securityCheck.status === ScanStatus.BLOCKED;

		return isBlocked;
	}

	public hasScanStatusError(): boolean {
		const hasError = this.securityCheck.status === ScanStatus.ERROR;

		return hasError;
	}

	public isPending(): boolean {
		const isPending = this.securityCheck.status === ScanStatus.PENDING;

		return isPending;
	}

	public isVerified(): boolean {
		const isVerified = this.securityCheck.status === ScanStatus.VERIFIED;

		return isVerified;
	}

	public getParentInfo(): IParentInfo {
		const { parentId, parentType, schoolId } = this;

		return { parentId, parentType, schoolId };
	}

	public getSchoolId(): EntityId {
		return this.schoolId;
	}

	public getPreviewStatus(): PreviewStatus {
		if (this.isPending()) {
			return PreviewStatus.AWAITING_SCAN_STATUS;
		}

		if (this.hasScanStatusError()) {
			return PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_ERROR;
		}

		if (this.isBlocked()) {
			return PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_BLOCKED;
		}

		if (!Object.values<string>(PreviewInputMimeTypes).includes(this.mimeType)) {
			return PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE;
		}

		return PreviewStatus.PREVIEW_POSSIBLE;
	}
}
