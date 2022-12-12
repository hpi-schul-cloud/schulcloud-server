import { EntityId, News } from '@shared/domain';
import { Loggable, LogMessage } from '@src/core/logger/interfaces/loggable';
import { NewsMapper } from '../mapper/news.mapper';

export enum CrudOperation {
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
}

export class NewsCrudOperationLoggable implements Loggable {
	news: News;

	userId: EntityId;

	operation: CrudOperation;

	constructor(operation: CrudOperation, news: News, userId: EntityId) {
		this.news = news;
		this.userId = userId;
		this.operation = operation;
	}

	getLogMessage(): LogMessage {
		return {
			message: 'Performing Crud Operation on a News',
			data: {
				operation: this.operation,
				userId: this.userId,
				news: NewsMapper.MapToLogMessageData(this.news),
			},
		};
	}
}
