import { EntityId, News } from '@shared/domain';

export class LoggingUtils {
	public static createMessageForCrudOperation(operation: CrudOperation, userId: EntityId, news: News): string {
		const message = `Performing a CRUD operation on a news, operation: ${operation}, userId: ${userId}, newsId: ${news.id}`;

		return message;
	}
}

export enum CrudOperation {
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
}
