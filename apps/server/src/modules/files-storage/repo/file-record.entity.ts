import { Embeddable, Embedded, Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { ObjectIdType } from '@shared/repo/types/object-id.type';
import { v4 as uuid } from 'uuid';
import { FileRecord, FileRecordProps, FileRecordSecurityCheckProps, ScanStatus } from '../domain';
import { FileRecordParentType, StorageLocation } from '../domain/interface';

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

	constructor(props: FileRecordSecurityCheckProps) {
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
