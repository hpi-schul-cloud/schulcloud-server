import { Entity, Index, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain';

export interface RocketChatUserEntityProps {
	id?: EntityId;
	userId: EntityId;
	username: string;
	rcId: string;
	authToken?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'rocketchatuser' })
export class RocketChatUserEntity extends BaseEntityWithTimestamps {
	@Property()
	username: string;

	@Property()
	@Index()
	_userId: ObjectId;

	get userId(): EntityId {
		return this._userId.toHexString();
	}

	@Property()
	@Index()
	rcId: string;

	@Property({ nullable: true })
	authToken?: string;

	constructor(props: RocketChatUserEntityProps) {
		super();

		if (props.id !== undefined) {
			this.id = props.id;
		}

		this._userId = new ObjectId(props.userId);
		this.username = props.username;
		this.rcId = props.rcId;

		if (props.authToken !== undefined) {
			this.authToken = props.authToken;
		}

		if (props.createdAt !== undefined) {
			this.createdAt = props.createdAt;
		}

		if (props.updatedAt !== undefined) {
			this.updatedAt = props.updatedAt;
		}
	}
}
