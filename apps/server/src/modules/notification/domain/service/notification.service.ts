import { Injectable } from '@nestjs/common';
import { Logger } from '@core/logger';
import { NotificationLoggable } from '../loggable/notification-loggable';
import { Notification } from '../../domain/do/notification.do';
import { NotificationRepo } from '../interfaces/notification.repo.interface';

@Injectable()
export class NotificationService {
	constructor(private readonly logger: Logger, private readonly notificationRepo: NotificationRepo) {
		logger.setContext(NotificationService.name);
	}

	public async create(notification: Notification): Promise<Notification> {
		await this.notificationRepo.create(notification);
		this.logger.info(new NotificationLoggable('A notification entry was created.'));
		return notification;
	}
}
