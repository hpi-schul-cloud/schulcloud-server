import { ObjectId } from '@mikro-orm/mongodb';
import { NotificationType } from '../../../types';
import { DoBaseFactory } from '@testing/factory/domainobject';
import { NotificationEntity, NotificationEntityProps } from '../notification.entity';

const fixedDate = new Date();
export const notificationEntityFactory = DoBaseFactory.define<NotificationEntity, NotificationEntityProps>(
	NotificationEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			type: NotificationType.NOTE,
			key: 'INFO_KEY',
			arguments: ['arg1'],
			userId: 'user-id',
			createdAt: fixedDate,
			updatedAt: fixedDate,
		};
	}
);
