import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { DeletionStatusModel } from '../domain/types';
import { DomainName } from '../types';

const SECONDS_OF_90_DAYS = 90 * 24 * 60 * 60;
export interface DeletionRequestEntityProps {
	id?: EntityId;
	targetRefDomain: DomainName;
	deleteAfter: Date;
	targetRefId: EntityId;
	status: DeletionStatusModel;
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
	targetRefId!: EntityId;

	@Property()
	targetRefDomain: DomainName;

	@Property()
	status: DeletionStatusModel;

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
		this.status = DeletionStatusModel.SUCCESS;
	}

	public failed(): void {
		this.status = DeletionStatusModel.FAILED;
	}

	public pending(): void {
		this.status = DeletionStatusModel.PENDING;
	}
}
