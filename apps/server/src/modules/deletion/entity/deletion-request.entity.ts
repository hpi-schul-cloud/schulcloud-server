import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { DeletionStatusModel } from '../domain/types/deletion-status-model.enum';

export interface DeletionRequestEntityProps {
	id?: EntityId;
	domain: DeletionDomainModel;
	deleteAfter: Date;
	itemId: EntityId;
	status: DeletionStatusModel;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'deletionrequests' })
@Index({ properties: ['_itemId', 'domain'] })
export class DeletionRequestEntity extends BaseEntityWithTimestamps {
	@Property()
	deleteAfter: Date;

	@Property()
	_itemId: ObjectId;

	get itemId(): EntityId {
		return this._itemId.toHexString();
	}

	@Property()
	domain: DeletionDomainModel;

	@Property()
	status: DeletionStatusModel;

	constructor(props: DeletionRequestEntityProps) {
		super();
		if (props.id !== undefined) {
			this.id = props.id;
		}

		this.domain = props.domain;
		this.deleteAfter = props.deleteAfter;
		this._itemId = new ObjectId(props.itemId);
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
}
