import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { NotificationServiceEntity } from './notification-service.entity';
import { EntityName } from '@mikro-orm/core';
import { NotificationServiceDto } from './dto/notification-service.dto';

@Injectable()
export class NotificationServiceRepo extends BaseRepo<NotificationServiceEntity> {
	get entityName(): EntityName<NotificationServiceEntity> {
		throw new Error('Method not implemented.');
	}

	public async createAndSaveNotification(
		notificationServiceEntity: NotificationServiceEntity
	): Promise<NotificationServiceEntity> {
		await this.save(this.create(notificationServiceEntity));

		return notificationServiceEntity;
	}

	public static mapDtoToEntity(notificationServiceDto: NotificationServiceDto): NotificationServiceEntity {
		return {
			notificationType: notificationServiceDto.notificationType,
			notifcationKey: notificationServiceDto.notificationKey,
			notificationArguments: notificationServiceDto.notificationArguments,
			userId: notificationServiceDto.userId,
		};
	}
}
