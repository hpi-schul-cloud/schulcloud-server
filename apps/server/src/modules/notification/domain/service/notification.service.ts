import { Inject, Injectable } from '@nestjs/common';
import { Notification } from '../../domain/do';
import { NOTIFICATION_REPO, NotificationRepo } from '../interfaces';
import { NotificationType } from '../../types';
import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';

export type NotificationEntry = {
	type: NotificationType;
	key: string;
	arguments?: Record<string, unknown>;
	userId: string;
	expiresAt: Date;
};

@Injectable()
export class NotificationService {
	constructor(@Inject(NOTIFICATION_REPO) private readonly notificationRepo: NotificationRepo) {}

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

	public getUnreadNotifications(userId: EntityId): Promise<Notification[]> {
		return this.notificationRepo.findForUser(userId);
	}

	public async deleteNotification(notificationId: EntityId): Promise<void> {
		await this.notificationRepo.delete(notificationId);
	}
}
