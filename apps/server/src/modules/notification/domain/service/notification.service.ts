import { Injectable } from '@nestjs/common';
import { Logger } from '@core/logger';
import { NotificationLoggable } from '../loggable';
import { Notification } from '../../domain/do';
import { NotificationRepo } from '../interfaces';
import { NotificationType } from '../../types';
import { ObjectId } from '@mikro-orm/mongodb';

export type NotificationEntry = {
	type: NotificationType;
	key: string;
	arguments: string[];
	userId: string;
	expiresAt: Date;
};

@Injectable()
export class NotificationService {
	constructor(private readonly logger: Logger, private readonly notificationRepo: NotificationRepo) {
		logger.setContext(NotificationService.name);
	}

	public async createNotification(entry: NotificationEntry): Promise<Notification> {
		const notification = new Notification({
			id: new ObjectId().toHexString(),
			type: entry.type,
			key: entry.key,
			arguments: entry.arguments,
			userId: entry.userId,
			expiresAt: entry.expiresAt,
		});

		await this.notificationRepo.create(notification);
		this.logger.info(
			new NotificationLoggable('A notification entry was created.', {
				type: notification.type,
				key: notification.key,
				arguments: notification.arguments.join(','),
			})
		);
		return notification;
	}
}
