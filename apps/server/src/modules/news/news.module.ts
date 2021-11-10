import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { NewsRepo } from '@shared/repo';
import { NewsUc } from './uc/news.uc';
import { NewsController } from './controller/news.controller';
import { TeamNewsController } from './controller/team-news.controller';

/* NewsController
 * to enable:
 * - unskip e2e tests
 * - execute migration news_add_target_schools (in migrations/scheduled)
 * - update backup/setup/news.json from db after migration has been executed
 */
@Module({
	imports: [AuthorizationModule, LoggerModule],
	controllers: [NewsController, TeamNewsController],
	providers: [NewsUc, NewsRepo],
	exports: [NewsUc],
})
export class NewsModule {}
