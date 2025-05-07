import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { forwardRef, Module } from '@nestjs/common';
import { DeletionModule } from '@modules/deletion';
import { NewsController, NewsUc, TeamNewsController } from './api';
import { NewsRepo } from './repo/news.repo';
import { NewsService } from './domain';

// imports from deletion module?
@Module({
	imports: [LoggerModule, forwardRef(() => AuthorizationModule), DeletionModule],
	controllers: [NewsController, TeamNewsController],
	providers: [NewsUc, NewsRepo, NewsService],
	exports: [NewsUc, NewsService],
})
export class NewsModule {}
