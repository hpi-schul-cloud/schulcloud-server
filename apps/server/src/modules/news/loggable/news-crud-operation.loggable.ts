import { News } from '@shared/domain';
import { EntityId } from '@shared/domain/types';
import { CrudOperation } from '@shared/types';
import { Loggable, LogMessage } from '@src/core/logger';
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
