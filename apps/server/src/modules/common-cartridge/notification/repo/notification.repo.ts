import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { NotificationEntity } from '../entities/notification.entity';
import { EntityName } from '@mikro-orm/core';
import { NotificationDto } from '../dto/notification.dto';
import { ObjectId } from '@mikro-orm/mongodb';

@Injectable()
export class NotificationRepo extends BaseRepo<NotificationEntity> {
	get entityName(): EntityName<NotificationEntity> {
		throw new Error('Method not implemented.');
	}

	public async createAndSaveNotification(
		notificationEntity: NotificationEntity
	): Promise<NotificationEntity> {
		await this.save(this.create(notificationEntity));

		return notificationEntity;
	}

	// where and when should this be used, needs no test
	public static mapDtoToEntity(notificationDto: NotificationDto): NotificationEntity {
		return {
			notificationType: notificationDto.notificationType,
			notifcationKey: notificationDto.notificationKey,
			notificationArguments: notificationDto.notificationArguments,
			userId: notificationDto.userId,
			_id: new ObjectId(),
			id: '',
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
}
