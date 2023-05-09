import { Module } from '@nestjs/common';
import { NewsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { NewsController } from './controller/news.controller';
import { TeamNewsController } from './controller/team-news.controller';
import { NewsUc } from './uc/news.uc';

@Module({
	imports: [AuthorizationModule, LoggerModule],
	controllers: [NewsController, TeamNewsController],
	providers: [NewsUc, NewsRepo],
	exports: [NewsUc],
})
export class NewsModule {}
