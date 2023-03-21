import { EntityId, News } from '@shared/domain';
import { Loggable, LogMessage } from '@src/core/logger';
import { NewsMapper } from '../mapper/news.mapper';

export enum CrudOperation {
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
}

export class NewsCrudOperationLoggable implements Loggable {
	constructor(
		private readonly operation: CrudOperation,
		private readonly userId: EntityId,
		private readonly news: News
	) {}

	getLogMessage(): LogMessage {
		return {
			message: 'Performing a CRUD operation on a news',
			data: {
				operation: this.operation,
				userId: this.userId,
				news: NewsMapper.MapToLogMessageData(this.news),
			},
		};
	}
}
