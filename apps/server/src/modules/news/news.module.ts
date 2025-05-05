import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { forwardRef, Module } from '@nestjs/common';
import { NewsController, NewsUc, TeamNewsController } from './api';
import { NewsService } from './domain';
import { NewsRepo } from './repo/news.repo';
import { DeleteUserNewsDataStep } from './saga';

// imports from deletion module?
@Module({
	imports: [LoggerModule, forwardRef(() => AuthorizationModule)],
	controllers: [NewsController, TeamNewsController],
	providers: [NewsUc, NewsRepo, NewsService, DeleteUserNewsDataStep],
	exports: [NewsUc, NewsService],
})
export class NewsModule {}
