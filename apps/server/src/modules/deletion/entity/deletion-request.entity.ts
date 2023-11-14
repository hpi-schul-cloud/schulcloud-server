import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { DeletionStatusModel } from '../domain/types/deletion-status-model.enum';

export interface DeletionRequestEntityProps {
	id?: EntityId;
	targetRefDomain: DeletionDomainModel;
	deleteAfter: Date;
	targetRefId: EntityId;
	status: DeletionStatusModel;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'deletionrequests' })
@Index({ properties: ['targetRefId', 'targetRefDomain'] })
export class DeletionRequestEntity extends BaseEntityWithTimestamps {
	@Property()
	deleteAfter: Date;

	@Property()
	targetRefId: EntityId;

	@Property()
	targetRefDomain: DeletionDomainModel;

	@Property()
	@Index()
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
}
