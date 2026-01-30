import { Injectable } from '@nestjs/common';
import { NotificationRepo } from '../../repo/notification.repo';
import { Logger } from '@core/logger';
import { NotificationLoggable } from './notification-loggable';
import { NotificationType } from '../../types/notification-type.enum';
import { NotificationEntity } from '../../repo/entities/notification.entity';
import { NotificationMapper } from '../../repo/mapper/notification.mapper';
import { Notification } from '../../domain/do/notification.do';

@Injectable()
export class NotificationService {
	constructor(private readonly logger: Logger, private readonly notificationRepo: NotificationRepo) {
		logger.setContext(NotificationService.name);
	}

	public async create(notification: Notification): Promise<NotificationEntity> {
		const entity = NotificationMapper.mapToEntity(notification);
		await this.notificationRepo.createNotification(entity);
		if ((entity.type = NotificationType.ERROR)) {
			this.logger.warning(new NotificationLoggable('An error occurred during the import process:' + entity.arguments));
		} else {
			this.logger.info(new NotificationLoggable('The import was successful.'));
		}
		return entity;
	}

	public findAll(): string {
		return `This action returns all notifications`;
	}

	public findOne(id: number): string {
		return `This action returns a #${id} notification`;
	}

	public remove(id: number): string {
		return `This action removes a #${id} notification`;
	}
}
