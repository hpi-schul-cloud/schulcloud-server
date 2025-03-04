import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { NewsRepo } from '@shared/repo/news';
import { DeletionModule } from '@modules/deletion';
import { NewsController } from './controller/news.controller';
import { TeamNewsController } from './controller/team-news.controller';
import { NewsUserDeleteService } from './service/news-user-delete.service';
import { NewsUc } from './uc/news.uc';

// imports from deletion module?
@Module({
	imports: [AuthorizationModule, CqrsModule, LoggerModule, forwardRef(() => DeletionModule)],
	controllers: [NewsController, TeamNewsController],
	providers: [NewsUc, NewsRepo, NewsUserDeleteService],
	exports: [NewsUc, NewsUserDeleteService],
})
export class NewsModule {}
