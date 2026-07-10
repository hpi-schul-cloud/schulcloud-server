import { type EntityName } from '@mikro-orm/core';
import { type NotificationEntity } from '../../repo/entities';
import { type EntityId } from '@shared/domain/types';
import { type Notification } from '../do';

export const NOTIFICATION_REPO = 'NOTIFICATION_REPO';

export interface NotificationRepo {
	get entityName(): EntityName<NotificationEntity>;

	findById(notificationId: EntityId): Promise<Notification>;

	findForUser(userId: EntityId): Promise<Notification[]>;

	create(notification: Notification | Notification[]): Promise<void>;

	delete(notificationId: EntityId): Promise<void>;
}
