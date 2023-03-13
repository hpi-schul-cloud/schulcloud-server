import { Module } from '@nestjs/common';
import { NewsRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { NewsController } from './controller/news.controller';
import { TeamNewsController } from './controller/team-news.controller';
import { NewsUc } from './uc/news.uc';

@Module({
	imports: [AuthorizationModule],
	controllers: [NewsController, TeamNewsController],
	providers: [NewsUc, NewsRepo, LegacyLogger],
	exports: [NewsUc],
})
export class NewsModule {}
