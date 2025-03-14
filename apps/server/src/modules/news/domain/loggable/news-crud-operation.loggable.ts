import { Loggable, LogMessage } from '@core/logger';
import { EntityId } from '@shared/domain/types';
import { News } from '../../repo';
import { NewsLogMapper } from '../mapper';
import { CrudOperation } from '../type';

export class NewsCrudOperationLoggable implements Loggable {
	constructor(
		private readonly operation: CrudOperation,
		private readonly userId: EntityId,
		private readonly news: News
	) {}

	public getLogMessage(): LogMessage {
		return {
			message: 'Performing a CRUD operation on a news',
			data: {
				operation: this.operation,
				userId: this.userId,
				news: NewsLogMapper.mapToLogMessageData(this.news),
			},
		};
	}
}
