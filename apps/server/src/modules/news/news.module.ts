import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { NewsController, NewsUc, TeamNewsController } from './api';
import { NewsService } from './domain';
import { NewsRepo } from './repo/news.repo';

// imports from deletion module?
@Module({
	imports: [CqrsModule, LoggerModule, forwardRef(() => AuthorizationModule)],
	controllers: [NewsController, TeamNewsController],
	providers: [NewsUc, NewsRepo, NewsService],
	exports: [NewsUc, NewsService],
})
export class NewsModule {}
