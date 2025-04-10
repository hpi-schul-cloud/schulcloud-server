import { Embeddable, Embedded, Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { ObjectIdType } from '@shared/repo/types/object-id.type';
import { v4 as uuid } from 'uuid';
import { FileRecord, FileRecordProps, FileRecordSecurityCheckProps } from '../domain';
import { FileRecordParentType, StorageLocation } from '../domain/interface';

export enum ScanStatus {
	PENDING = 'pending',
	VERIFIED = 'verified',
	BLOCKED = 'blocked',
	WONT_CHECK = 'wont_check',
	ERROR = 'error',
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
export class FileRecordSecurityCheckEmbeddable implements FileRecordSecurityCheckProps {
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
	storageLocation: StorageLocation;
	storageLocationId: EntityId;
	deletedSince?: Date;
	isCopyFrom?: EntityId;
	isUploading?: boolean;
}

interface ParentInfo {
	storageLocationId: EntityId;
	storageLocation: StorageLocation;
	parentId: EntityId;
	parentType: FileRecordParentType;
}

/**
 * Note: The file record entity will not manage any entity relations by itself.
 * That's why we do not map any relations in the entity class
 * and instead just use the plain object ids.
 */
@Entity({ tableName: 'filerecords' })
@Index({ properties: ['storageLocation', '_storageLocationId', '_parentId'], options: { background: true } })
// https://github.com/mikro-orm/mikro-orm/issues/1230
@Index({ options: { 'securityCheck.requestToken': 1 } })
export class FileRecordEntity extends BaseEntityWithTimestamps implements FileRecordProps {
	@Index({ options: { expireAfterSeconds: 7 * 24 * 60 * 60 } })
	@Property({ nullable: true })
	deletedSince?: Date;

	@Property()
	size!: number;

	@Property()
	name!: string;

	@Property()
	mimeType!: string; // TODO mime-type enum?

	@Embedded(() => FileRecordSecurityCheckEmbeddable, { object: true, nullable: false })
	securityCheck!: FileRecordProps['securityCheck'];

	@Index()
	@Enum()
	parentType!: FileRecordParentType;

	@Property({ nullable: true })
	isUploading?: boolean;

	@Index()
	@Property({ type: ObjectIdType, fieldName: 'parent', nullable: false })
	parentId!: EntityId;

	@Index()
	@Property({ type: ObjectIdType, fieldName: 'creator', nullable: true })
	creatorId?: EntityId;

	@Property({ type: ObjectIdType, fieldName: 'storageLocationId', nullable: false })
	storageLocationId!: EntityId;

	@Property()
	storageLocation!: StorageLocation;

	@Property({ type: ObjectIdType, fieldName: 'isCopyFrom', nullable: true })
	isCopyFrom?: EntityId;

	@Property({ persist: false })
	domainObject: FileRecord | undefined;
}
