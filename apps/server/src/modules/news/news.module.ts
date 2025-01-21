import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { NewsRepo } from '@shared/repo/news';
import { LoggerModule } from '@src/core/logger';
import { NewsController } from './controller/news.controller';
import { TeamNewsController } from './controller/team-news.controller';
import { NewsService } from './service/news.service';
import { NewsUc } from './uc/news.uc';

// imports from deletion module?
@Module({
	imports: [AuthorizationModule, CqrsModule, LoggerModule],
	controllers: [NewsController, TeamNewsController],
	providers: [NewsUc, NewsRepo, NewsService],
	exports: [NewsUc, NewsService],
})
export class NewsModule {}
