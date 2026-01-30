import { Injectable } from '@nestjs/common';
import { NotificationEntity } from './entities/notification.entity';
import { EntityName } from '@mikro-orm/core';

@Injectable()
export class NotificationRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName(): EntityName<NotificationEntity> {
		throw new Error('Method not implemented.');
	}

	public async createNotification(notificationEntity: NotificationEntity): Promise<NotificationEntity> {
		await this.save(this.create(notificationEntity));

		return notificationEntity;
	}
}
