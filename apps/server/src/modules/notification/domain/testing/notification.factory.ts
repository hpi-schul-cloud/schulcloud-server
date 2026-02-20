import { ObjectId } from '@mikro-orm/mongodb';
import { NotificationType } from '../../types';
import { DoBaseFactory } from '@testing/factory/domainobject';
import { Notification, NotificationProps } from '../do/notification.do';

const fixedDate = new Date();
export const notificationFactory = DoBaseFactory.define<Notification, NotificationProps>(Notification, () => {
	return {
		id: new ObjectId().toHexString(),
		type: NotificationType.NOTE,
		key: 'INFO_KEY',
		arguments: ['arg1'],
		userId: 'user-id',
		createdAt: fixedDate,
		updatedAt: fixedDate,
	};
});
