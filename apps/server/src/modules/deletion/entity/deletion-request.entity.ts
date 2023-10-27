import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { DeletionStatusModel } from '../domain/types/deletion-status-model.enum';

export interface DeletionRequestEntityProps {
	id?: EntityId;
	domain?: DeletionDomainModel;
	deleteAfter?: Date;
	itemId?: EntityId;
	status?: DeletionStatusModel;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'deletionrequests' })
export class DeletionRequestEntity extends BaseEntityWithTimestamps {
	@Property({ nullable: true })
	deleteAfter?: Date;

	@Property({ fieldName: 'itemToDeletion', nullable: true })
	@Index()
	_itemId?: ObjectId;

	get itemId(): EntityId | undefined {
		return this._itemId?.toHexString();
	}

	@Property({ nullable: true })
	domain?: DeletionDomainModel;

	@Property({ nullable: true })
	status?: DeletionStatusModel;

	constructor(props: DeletionRequestEntityProps) {
		super();
		if (props.id !== undefined) {
			this.id = props.id;
		}

		if (props.domain !== undefined) {
			this.domain = props.domain;
		}

		if (props.deleteAfter !== undefined) {
			this.deleteAfter = props.deleteAfter;
		}

		if (props.itemId !== undefined) {
			this._itemId = new ObjectId(props.itemId);
		}

		if (props.status !== undefined) {
			this.status = props.status;
		}

		if (props.createdAt !== undefined) {
			this.createdAt = props.createdAt;
		}

		if (props.updatedAt !== undefined) {
			this.updatedAt = props.updatedAt;
		}
	}
}
