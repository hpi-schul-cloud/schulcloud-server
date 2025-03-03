import { LoggingUtils } from '@core/logger/logging.utils';
import { NewsCrudOperationLoggable } from '@modules/news/loggable/news-crud-operation.loggable';
import { CrudOperation } from '@shared/types/crud-operation.enum';
import { News } from '@shared/domain/entity';
import { NewsTargetModel } from '@shared/domain/types';
import { Configuration } from '@hpi-schul-cloud/commons';

describe('Logger', () => {
	describe('info', () => {
		it('should call info method of WinstonLogger with appropriate message', () => {
			Configuration.set('JSON_LOG_FORMAT', true);
			const news = News.createInstance(NewsTargetModel.School, {
				displayAt: new Date(),
				school: 'GhettoSchuleId',
				creator: 'creatorMax',
				target: 'fancyTargetId',
				title: 'newsTitle',
				content: 'newContent',
			});
			const loggable = new NewsCrudOperationLoggable(CrudOperation.CREATE, 'hans', news);
			const logMessageWithContext = LoggingUtils.createMessageWithContext(loggable, 'someUselessContext');
			console.log(logMessageWithContext);
		});

		it('undefined name', () => {
			Configuration.set('JSON_LOG_FORMAT', true);
			const news = News.createInstance(NewsTargetModel.School, {
				displayAt: new Date(),
				school: 'GhettoSchuleId',
				creator: 'creatorMax',
				target: 'fancyTargetId',
				title: 'newsTitle',
				content: 'newContent',
			});
			const loggable = new NewsCrudOperationLoggable(CrudOperation.CREATE, 'hans', news);
			const logMessageWithContext = LoggingUtils.createMessageWithContext(loggable, undefined);
			console.log(logMessageWithContext);
		});

		it('empty name', () => {
			Configuration.set('JSON_LOG_FORMAT', true);
			const news = News.createInstance(NewsTargetModel.School, {
				displayAt: new Date(),
				school: 'GhettoSchuleId',
				creator: 'creatorMax',
				target: 'fancyTargetId',
				title: 'newsTitle',
				content: 'newContent',
			});
			const loggable = new NewsCrudOperationLoggable(CrudOperation.CREATE, 'hans', news);
			const logMessageWithContext = LoggingUtils.createMessageWithContext(loggable, '');
			console.log(logMessageWithContext);
		});
	});
});
