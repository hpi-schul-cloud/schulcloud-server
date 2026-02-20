import { NotificationEntity } from '../entities';
import { Notification } from '../../domain/do/notification.do';

export class NotificationMapper {
	public static mapToDO(entity: NotificationEntity): Notification {
		return new Notification({
			id: entity.id,
			type: entity.type,
			key: entity.key,
			arguments: entity.arguments,
			userId: entity.userId,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});
	}

	public static mapToEntity(domainObject: Notification): NotificationEntity {
		return new NotificationEntity({
			type: domainObject.type,
			key: domainObject.key,
			arguments: domainObject.arguments,
			userId: domainObject.userId,
			id: domainObject.id,
			createdAt: domainObject.createdAt,
			updatedAt: domainObject.updatedAt,
		});
	}

	public static mapToDOs(entities: NotificationEntity[]): Notification[] {
		return entities.map((entity) => this.mapToDO(entity));
	}

	public static mapToEntities(domainObjects: Notification[]): NotificationEntity[] {
		return domainObjects.map((domainObject) => this.mapToEntity(domainObject));
	}
}
