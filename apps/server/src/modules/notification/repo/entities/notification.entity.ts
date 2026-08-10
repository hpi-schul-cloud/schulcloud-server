import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { NotificationType } from '../../types';

export interface NotificationEntityProps {
	id?: EntityId;
	type: NotificationType;
	key: string;
	arguments?: Record<string, unknown>;
	userId: EntityId;
	expiresAt: Date;
}

@Entity({ tableName: 'notifications' })
export class NotificationEntity extends BaseEntityWithTimestamps {
	@Enum({ nullable: true, items: () => NotificationType })
	type: NotificationType;

	@Property({ nullable: true, type: 'string' })
	key: string;

	@Property({ nullable: true, type: 'object' })
	arguments?: Record<string, unknown>;

	@Property({ nullable: true, type: 'string' })
	@Index()
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
		this.key = props.key;
		this.arguments = props.arguments;
		this.userId = props.userId;
		this.expiresAt = props.expiresAt;
	}
}
