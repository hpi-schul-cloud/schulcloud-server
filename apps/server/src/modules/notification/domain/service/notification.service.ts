import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@core/logger';
import { Notification } from '../../domain/do';
import { NOTIFICATION_REPO, NotificationRepo } from '../interfaces';
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
	constructor(
		private readonly logger: Logger,
		@Inject(NOTIFICATION_REPO) private readonly notificationRepo: NotificationRepo
	) {
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

		return notification;
	}

	public async getUnreadNotifications(userId: string): Promise<Notification[]> {
		return this.notificationRepo.findForUser(userId);
	}

	public async deleteNotification(notificationId: string): Promise<void> {
		await this.notificationRepo.delete(notificationId);
	}
}
