import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { DomainName, StatusModel } from '../../domain/types';

const SECONDS_OF_90_DAYS = 90 * 24 * 60 * 60;
export interface DeletionRequestEntityProps {
	id?: EntityId;
	targetRefDomain: DomainName;
	deleteAfter: Date;
	targetRefId: EntityId;
	status: StatusModel;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'deletionrequests' })
@Unique({ properties: ['targetRefId', 'targetRefDomain'] })
export class DeletionRequestEntity extends BaseEntityWithTimestamps {
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

	constructor(props: DeletionRequestEntityProps) {
		super();
		if (props.id !== undefined) {
			this.id = props.id;
		}

		this.targetRefDomain = props.targetRefDomain;
		this.deleteAfter = props.deleteAfter;
		this.targetRefId = props.targetRefId;
		this.status = props.status;

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
