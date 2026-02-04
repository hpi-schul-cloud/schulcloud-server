import { Injectable } from '@nestjs/common';
import { NotificationRepo } from '../../repo/notification.repo';
import { Logger } from '@core/logger';
import { NotificationLoggable } from '../loggable/notification-loggable';
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
		await this.notificationRepo.create(notification);
		// just log that a notification was created.
		this.logger.info(new NotificationLoggable('A notification entry was created.'));
		return entity;
	}
}
