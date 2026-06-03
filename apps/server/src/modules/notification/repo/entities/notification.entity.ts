import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { NotificationType } from '../../types';

export interface NotificationEntityProps {
	id?: EntityId;
	type: NotificationType;
	messageOrKey: string;
	arguments?: Record<string, unknown>;
	userId: EntityId;
	expiresAt: Date;
}

@Entity({ tableName: 'notifications' })
export class NotificationEntity extends BaseEntityWithTimestamps {
	@Property({ nullable: true })
	type: NotificationType;

	@Property({ nullable: true })
	messageOrKey: string;

	@Property({ nullable: true })
	arguments?: Record<string, unknown>;

	@Property({ nullable: true })
	userId: EntityId;

	@Property({ nullable: true })
	@Index({ options: { expireAfterSeconds: 0 } })
	expiresAt: Date;

	constructor(props: NotificationEntityProps) {
		super();

		if (props.id !== undefined) {
			this.id = props.id;
		}

		this.type = props.type;
		this.messageOrKey = props.messageOrKey;
		this.arguments = props.arguments;
		this.userId = props.userId;
		this.expiresAt = props.expiresAt;
	}
}
