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
			type: NotificationType.INFO,
			messageOrKey: 'infoMessageKey',
			arguments: {},
			userId: 'user-id',
			expiresAt: fixedDate,
		};
	}
);
