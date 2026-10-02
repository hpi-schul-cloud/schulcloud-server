import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { ObjectIdType } from '@shared/repo/types/object-id.type';

export type SchoolMaterialTransferType = 'course' | 'room';
export type FormerMembershipType = SchoolMaterialTransferType;
export type SchoolMaterialTransferStatus = 'completed' | 'discarded';

export interface SchoolMaterialTransferRequestEntityProps {
	id?: EntityId;
	requesterUserId: EntityId;
	requesterSchoolId: EntityId;
	originSchoolId: EntityId;
	type: SchoolMaterialTransferType;
	refId: EntityId;
	targetRefId?: EntityId;
	name: string;
	status?: SchoolMaterialTransferStatus;
	transferredAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'school_material_transfer_requests' })
@Index({ properties: ['requesterUserId', 'status'] })
@Index({ properties: ['requesterSchoolId'] })
@Index({ properties: ['originSchoolId'] })
@Index({ properties: ['refId', 'type'] })
export class SchoolMaterialTransferRequestEntity
	extends BaseEntityWithTimestamps
	implements SchoolMaterialTransferRequestEntityProps
{
	@Property({ type: ObjectIdType })
	@Index()
	requesterUserId!: EntityId;

	@Property({ type: ObjectIdType })
	@Index()
	requesterSchoolId!: EntityId;

	@Property({ type: ObjectIdType })
	@Index()
	originSchoolId!: EntityId;

	@Property()
	type!: SchoolMaterialTransferType;

	@Property({ type: ObjectIdType })
	@Index()
	refId!: EntityId;

	@Property({ type: ObjectIdType, nullable: true })
	targetRefId?: EntityId;

	@Property()
	name!: string;

	@Property({ default: 'completed' })
	@Index()
	status!: SchoolMaterialTransferStatus;

	@Property({ nullable: true })
	transferredAt?: Date;

	constructor(props?: SchoolMaterialTransferRequestEntityProps) {
		super();
		if (!props) return;

		if (props.id !== undefined) {
			this.id = props.id;
		}
		this.requesterUserId = props.requesterUserId;
		this.requesterSchoolId = props.requesterSchoolId;
		this.originSchoolId = props.originSchoolId;
		this.type = props.type;
		this.refId = props.refId;
		this.targetRefId = props.targetRefId;
		this.name = props.name;
		this.status = props.status ?? 'completed';
		this.transferredAt = props.transferredAt;
		if (props.createdAt) {
			this.createdAt = props.createdAt;
		}
		if (props.updatedAt) {
			this.updatedAt = props.updatedAt;
		}
	}
}
