import { EntityName } from '@mikro-orm/core';
import { NotificationEntity } from '../../repo/entities';
import { EntityId } from '@shared/domain/types';
import { Notification } from '../do/notification.do';

export interface NotificationRepo {
	get entityName(): EntityName<NotificationEntity>;

	findById(notificationId: EntityId): Promise<Notification>;

	create(notification: Notification | Notification[]): Promise<void>;
}
