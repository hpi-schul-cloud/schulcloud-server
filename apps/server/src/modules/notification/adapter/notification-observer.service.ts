import { Injectable, OnModuleInit } from '@nestjs/common';
import { Subject } from 'rxjs';
import { EntityManager } from '@mikro-orm/mongodb';
import { NotificationEntity } from '../repo/entities';
import { Logger } from '@core/logger';
import { NotificationLoggable } from '../domain/loggable';
import { ErrorLoggable } from '@core/error/loggable/error.loggable';

@Injectable()
export class NotificationObserverService implements OnModuleInit {
	private readonly notificationSubject = new Subject<any>();

	constructor(
		private readonly em: EntityManager,
		private readonly logger: Logger
	) {
		this.logger.setContext(NotificationObserverService.name);
	}

	async onModuleInit() {
		const collection = this.em.getCollection(NotificationEntity);
		const changeStream = collection.watch([{ $match: { operationType: 'insert' } }], { fullDocument: 'updateLookup' });

		changeStream.on('change', (change) => {
			if (change.operationType === 'insert') {
				const notification = change.fullDocument;
				this.logger.info(new NotificationLoggable(notification.userId));
				this.notificationSubject.next(notification);
			}
		});

		changeStream.on('error', (error) => {
			this.logger.warning(new ErrorLoggable(error, { message: 'Notification ChangeStream error' }));
		});
	}

	public get notifications$() {
		return this.notificationSubject.asObservable();
	}
}
