import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { DomainName, StatusModel } from '../../domain/types';
import { ObjectIdType } from '@shared/repo/types/object-id.type';

const SECONDS_OF_90_DAYS = 90 * 24 * 60 * 60;
export interface DeletionRequestEntityProps {
	id?: EntityId;
	targetRefDomain: DomainName;
	deleteAfter: Date;
	targetRefId: EntityId;
	status: StatusModel;
	batchId?: EntityId;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'deletionrequests' })
@Unique({ properties: ['targetRefId', 'targetRefDomain'] })
@Index({ properties: ['createdAt'] })
@Index({ properties: ['updatedAt'] })
export class DeletionRequestEntity extends BaseEntityWithTimestamps implements DeletionRequestEntityProps {
	@Property()
	@Index({ options: { expireAfterSeconds: SECONDS_OF_90_DAYS } })
	deleteAfter: Date;

	@Property()
	@Index()
	targetRefId!: EntityId;

	@Property()
	@Index()
	targetRefDomain: DomainName;

	@Property()
	@Index()
	status: StatusModel;

	@Property({ type: ObjectIdType, nullable: true })
	@Index()
	batchId: EntityId | undefined;

	constructor(props: DeletionRequestEntityProps) {
		super();
		if (props.id !== undefined) {
			this.id = props.id;
		}

		this.targetRefDomain = props.targetRefDomain;
		this.deleteAfter = props.deleteAfter;
		this.targetRefId = props.targetRefId;
		this.status = props.status;
		this.batchId = props.batchId;

		if (props.createdAt !== undefined) {
			this.createdAt = props.createdAt;
		}

		if (props.updatedAt !== undefined) {
			this.updatedAt = props.updatedAt;
		}
	}

	public executed(): void {
		this.status = StatusModel.SUCCESS;
	}

	public failed(): void {
		this.status = StatusModel.FAILED;
	}

	public pending(): void {
		this.status = StatusModel.PENDING;
	}
}
