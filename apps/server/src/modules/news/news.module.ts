import { Module } from '@nestjs/common';
import { NewsRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { NewsController } from './controller/news.controller';
import { TeamNewsController } from './controller/team-news.controller';
import { NewsUc } from './uc/news.uc';

/* NewsController
 * to enable:
 * - unskip e2e tests
 * - execute migration news_add_target_schools (in migrations/scheduled)
 * - update backup/setup/news.json from db after migration has been executed
 */
@Module({
	imports: [AuthorizationModule],
	controllers: [NewsController, TeamNewsController],
	providers: [NewsUc, NewsRepo, Logger],
	exports: [NewsUc],
})
export class NewsModule {}
