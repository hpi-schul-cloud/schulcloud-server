import { Module } from '@nestjs/common';
import { NewsRepo } from '@shared/repo/news/news.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthorizationModule } from '../authorization/authorization.module';
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
