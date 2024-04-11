import { PreviewInputMimeTypes } from '@infra/preview-generator';
import { Embeddable, Embedded, Entity, Enum, Index, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException } from '@nestjs/common';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { ErrorType } from '../error';

export enum ScanStatus {
	PENDING = 'pending',
	VERIFIED = 'verified',
	BLOCKED = 'blocked',
	WONT_CHECK = 'wont_check',
	ERROR = 'error',
}

export enum FileRecordParentType {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'Task' = 'tasks',
	'Lesson' = 'lessons',
	'Submission' = 'submissions',
	'Grading' = 'gradings',
	'BoardNode' = 'boardnodes',
}

export enum PreviewStatus {
	PREVIEW_POSSIBLE = 'preview_possible',
	AWAITING_SCAN_STATUS = 'awaiting_scan_status',
	PREVIEW_NOT_POSSIBLE_SCAN_STATUS_ERROR = 'preview_not_possible_scan_status_error',
	PREVIEW_NOT_POSSIBLE_SCAN_STATUS_WONT_CHECK = 'preview_not_possible_scan_status_wont_check',
	PREVIEW_NOT_POSSIBLE_SCAN_STATUS_BLOCKED = 'preview_not_possible_scan_status_blocked',
	PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE = 'preview_not_possible_wrong_mime_type',
}

export interface FileRecordSecurityCheckProperties {
	status?: ScanStatus;
	reason?: string;
	requestToken?: string;
}
@Embeddable()
export class FileRecordSecurityCheck {
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

	constructor(props: FileRecordSecurityCheckProperties) {
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

export interface FileRecordProperties {
	size: number;
	name: string;
	mimeType: string;
	parentType: FileRecordParentType;
	parentId: EntityId;
	creatorId?: EntityId;
	schoolId: EntityId;
	deletedSince?: Date;
	isCopyFrom?: EntityId;
	isUploading?: boolean;
}

interface ParentInfo {
	schoolId: EntityId;
	parentId: EntityId;
	parentType: FileRecordParentType;
}

// TODO: EntityWithSchool

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

	@Embedded(() => FileRecordSecurityCheck, { object: true, nullable: false })
	securityCheck: FileRecordSecurityCheck;

	@Index()
	@Enum()
	parentType: FileRecordParentType;

	@Property({ nullable: true })
	isUploading?: boolean;

	@Index()
	@Property({ fieldName: 'parent' })
	_parentId: ObjectId;

	get parentId(): EntityId {
		return this._parentId.toHexString();
	}

	@Index()
	@Property({ fieldName: 'creator', nullable: true })
	_creatorId?: ObjectId;

	get creatorId(): EntityId | undefined {
		return this._creatorId?.toHexString();
	}

	set creatorId(userId: EntityId | undefined) {
		this._creatorId = userId !== undefined ? new ObjectId(userId) : undefined;
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

	constructor(props: FileRecordProperties) {
		super();
		this.size = props.size;
		this.name = props.name;
		this.mimeType = props.mimeType;
		this.parentType = props.parentType;
		this.isUploading = props.isUploading;
		this._parentId = new ObjectId(props.parentId);
		if (props.creatorId !== undefined) {
			this._creatorId = new ObjectId(props.creatorId);
		}
		this._schoolId = new ObjectId(props.schoolId);
		if (props.isCopyFrom) {
			this._isCopyFrom = new ObjectId(props.isCopyFrom);
		}
		this.securityCheck = new FileRecordSecurityCheck({});
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

	public copy(userId: EntityId, targetParentInfo: ParentInfo): FileRecord {
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

	public hasScanStatusWontCheck(): boolean {
		const hasWontCheckStatus = this.securityCheck.status === ScanStatus.WONT_CHECK;

		return hasWontCheckStatus;
	}

	public isPending(): boolean {
		const isPending = this.securityCheck.status === ScanStatus.PENDING;

		return isPending;
	}

	public isVerified(): boolean {
		const isVerified = this.securityCheck.status === ScanStatus.VERIFIED;

		return isVerified;
	}

	public isPreviewPossible(): boolean {
		const isPreviewPossible = Object.values<string>(PreviewInputMimeTypes).includes(this.mimeType);

		return isPreviewPossible;
	}

	public getParentInfo(): ParentInfo {
		const { parentId, parentType, schoolId } = this;

		return { parentId, parentType, schoolId };
	}

	public getSchoolId(): EntityId {
		return this.schoolId;
	}

	public getPreviewStatus(): PreviewStatus {
		if (this.isBlocked()) {
			return PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_BLOCKED;
		}

		if (!this.isPreviewPossible()) {
			return PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE;
		}

		if (this.isVerified()) {
			return PreviewStatus.PREVIEW_POSSIBLE;
		}

		if (this.isPending()) {
			return PreviewStatus.AWAITING_SCAN_STATUS;
		}

		if (this.hasScanStatusWontCheck()) {
			return PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_WONT_CHECK;
		}

		return PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_ERROR;
	}

	public get fileNameWithoutExtension(): string {
		const filenameObj = path.parse(this.name);

		return filenameObj.name;
	}

	public removeCreatorId(): void {
		this.creatorId = undefined;
	}

	public markAsUploaded(): void {
		this.isUploading = undefined;
	}
}
