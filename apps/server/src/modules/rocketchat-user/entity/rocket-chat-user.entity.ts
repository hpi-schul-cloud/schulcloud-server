import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';

export interface RocketChatUserEntityProps {
	id?: EntityId;
	userId: ObjectId;
	username: string;
	rcId: string;
	authToken?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'rocketchatuser' })
export class RocketChatUserEntity extends BaseEntityWithTimestamps {
	@Property()
	@Unique()
	username: string;

	@Property()
	@Unique()
	userId: ObjectId;

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

		this.userId = props.userId;
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
