import { Embeddable, Embedded, Entity, Enum, Index, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps, type EntityId } from '@shared/domain';
import { v4 as uuid } from 'uuid';
import { ScanStatus } from '../domain/filerecord.do';
import { FileRecordParentType } from '../interface';

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

	constructor(props: IFileSecurityCheckProperties = {}) {
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
	id?: EntityId;
	size: number;
	name: string;
	mimeType: string;
	parentType: FileRecordParentType;
	parentId: EntityId | ObjectId;
	creatorId: EntityId | ObjectId;
	schoolId: EntityId | ObjectId;
	deletedSince?: Date;
	isCopyFrom?: ObjectId;
}

/**
 * Note: The file record entity will not manage any entity relations by itself.
 * That's why we do not map any relations in the entity class
 * and instead just use the plain object ids.
 */
@Entity({ tableName: 'filerecords' })
@Index({ properties: ['_schoolId', '_parentId'], options: { background: true } })
// https://github.com/mikro-orm/mikro-orm/issues/1230
@Index({ options: { 'securityCheck.requestToken': 1 } })
export class FileRecordEntity extends BaseEntityWithTimestamps {
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
		return this._isCopyFrom?.toHexString();
	}

	constructor(props: IFileRecordProperties) {
		// important when we go over constructor to also allow entity creating with ID
		super();
		this.size = props.size;
		this.name = props.name;
		this.mimeType = props.mimeType;
		this.parentType = props.parentType;
		this._parentId = new ObjectId(props.parentId);
		this._creatorId = new ObjectId(props.creatorId);
		this._schoolId = new ObjectId(props.schoolId);
		this._isCopyFrom = props.isCopyFrom;
		this.securityCheck = new FileSecurityCheck({});
		this.deletedSince = props.deletedSince;
	}
}
