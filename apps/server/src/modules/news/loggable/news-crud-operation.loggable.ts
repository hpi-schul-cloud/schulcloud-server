import { EntityId, News } from '@shared/domain';
import { CrudOperation } from '@shared/types';
import { LogMessage, Loggable } from '@src/core/logger';
import { NewsMapper } from '../mapper/news.mapper';

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
				news: NewsMapper.mapToLogMessageData(this.news),
			},
		};
	}
}
