import { Embeddable, Embedded, Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { ObjectIdType } from '@shared/repo/types/object-id.type';
import { FileRecord, FileRecordProps, FileRecordSecurityCheckProps, ScanStatus } from '../domain';
import { FileRecordParentType, StorageLocation } from '../domain/interface';

@Embeddable()
export class FileRecordSecurityCheckEmbeddable implements FileRecordSecurityCheckProps {
	@Enum()
	status!: ScanStatus;

	@Property()
	reason!: string;

	@Property({ nullable: true })
	requestToken?: string;

	@Property()
	createdAt = new Date();

	@Property()
	updatedAt!: Date;
}

/**
 * Note: The file record entity will not manage any entity relations by itself.
 * That's why we do not map any relations in the entity class
 * and instead just use the plain object ids.
 */
@Entity({ tableName: 'filerecords' })
@Index({ properties: ['storageLocation', 'storageLocationId', 'parentId'], options: { background: true } })
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
	mimeType!: string;

	@Embedded(() => FileRecordSecurityCheckEmbeddable, { object: true, nullable: false })
	securityCheck!: FileRecordSecurityCheckEmbeddable;

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
