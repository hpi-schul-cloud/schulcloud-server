import { LogMessageData } from '@core/logger';
import { News } from '../../repo';

export class NewsLogMapper {
	public static mapToLogMessageData(news: News): LogMessageData {
		const data = {
			entityType: 'News',
			id: news.id,
			targetModel: news.targetModel,
			targetId: news.target.id,
		};

		return data;
	}
}
