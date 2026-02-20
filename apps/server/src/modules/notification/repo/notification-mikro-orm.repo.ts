import { Injectable } from '@nestjs/common';
import { NotificationEntity } from './entities/notification.entity';
import { EntityName, Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { NotificationMapper } from './mapper';
import { Notification } from '../domain/do/notification.do';
import { EntityId } from '@shared/domain/types';
import { NotificationRepo } from '.';

@Injectable()
export class NotificationMikroOrmRepo implements NotificationRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName(): EntityName<NotificationEntity> {
		return NotificationEntity;
	}

	public async findById(notificationId: EntityId): Promise<Notification> {
		const notification: NotificationEntity = await this.em.findOneOrFail(NotificationEntity, {
			id: notificationId,
		});

		const mapped: Notification = NotificationMapper.mapToDO(notification);

		return mapped;
	}

	public async create(notification: Notification | Notification[]): Promise<void> {
		const notifications = Utils.asArray(notification);

		notifications.forEach((domainObject) => {
			const notificationEntity: NotificationEntity = NotificationMapper.mapToEntity(domainObject);
			this.em.persist(notificationEntity);
		});

		await this.em.flush();
	}
}
