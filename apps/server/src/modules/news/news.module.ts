import { Module } from '@nestjs/common';
import { NewsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { CqrsModule } from '@nestjs/cqrs';
import { NewsController } from './controller/news.controller';
import { TeamNewsController } from './controller/team-news.controller';
import { NewsUc } from './uc/news.uc';
import { NewsService } from './service/news.service';

@Module({
	imports: [AuthorizationModule, CqrsModule, LoggerModule],
	controllers: [NewsController, TeamNewsController],
	providers: [NewsUc, NewsRepo, NewsService],
	exports: [NewsUc, NewsService],
})
export class NewsModule {}
