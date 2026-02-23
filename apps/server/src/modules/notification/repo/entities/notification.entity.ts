import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

export interface NotificationEntityProps {
	id?: EntityId;
	type: string;
	key: string;
	arguments: string[];
	userId: string;
	expiresAt: Date;
}

@Entity({ tableName: 'user-notification-message' })
export class NotificationEntity extends BaseEntityWithTimestamps {
	@Property({ nullable: true })
	type: string;

	@Property({ nullable: true })
	key: string;

	@Property({ nullable: true })
	arguments: string[];

	@Property({ nullable: true })
	userId: string;

	@Property({ nullable: true })
	expiresAt: Date;

	constructor(props: NotificationEntityProps) {
		super();

		if (props.id !== undefined) {
			this.id = props.id;
		}

		this.type = props.type;
		this.key = props.key;
		this.arguments = props.arguments;
		this.userId = props.userId;
		this.expiresAt = props.expiresAt;
	}
}
