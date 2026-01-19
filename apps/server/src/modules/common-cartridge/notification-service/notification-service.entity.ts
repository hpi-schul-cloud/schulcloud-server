import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { NotificationServiceDto } from './dto/notification-service.dto';

@Entity({ tableName: 'cc-user-notification-message' })
export class NotificationServiceEntity extends BaseEntityWithTimestamps {
	constructor(notificationServiceDto: NotificationServiceDto) {
		super();
		this.notificationType = notificationServiceDto.notificationType;
		this.notifcationKey = notificationServiceDto.notificationKey;
		this.notificationArguments = notificationServiceDto.notificationArguments;
		this.userId = notificationServiceDto.userId;
	}

	@Property({ nullable: true })
	notificationType?: string;

	@Property({ nullable: true })
	notifcationKey?: string;

	@Property({ nullable: true })
	notificationArguments?: string[];

	@Property({ nullable: true })
	userId?: string;
}
