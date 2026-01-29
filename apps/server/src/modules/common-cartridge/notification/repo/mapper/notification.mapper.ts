import { NotificationEntity } from '../entities';
import { Notification } from '../../domain/do/notification.do';
import { EntityId } from '@shared/domain/types';

export class NotificationMapper {


	static mapToDO(entity: NotificationEntity): Notification {
		return new Notification({
			id: entity.id as EntityId,
			type: entity.type as string,
			key: entity.key as string,
			arguments: entity.arguments as string[],
			userId: entity.userId as string,
		});
	}

	static mapToEntity(domainObject: Notification): NotificationEntity {
		return new NotificationEntity({
			type: domainObject.type,
			key: domainObject.key,
			arguments: domainObject.arguments,
			userId: domainObject.userId,
			id: domainObject.id,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	static mapToDOs(entities: NotificationEntity[]): Notification[] {
		return entities.map((entity) => this.mapToDO(entity));
	}

	static mapToEntities(domainObjects: Notification[]): NotificationEntity[] {
		return domainObjects.map((domainObject) => this.mapToEntity(domainObject));
	}
}
