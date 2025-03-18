import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { SagaModule } from '@modules/saga';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { NewsRepo } from '@shared/repo/news';
import { NewsController } from './controller/news.controller';
import { TeamNewsController } from './controller/team-news.controller';
import { DeleteUserReferenceFromNewsStep } from './saga';
import { NewsUc } from './uc/news.uc';

// imports from deletion module?
@Module({
	imports: [AuthorizationModule, CqrsModule, LoggerModule, SagaModule],
	controllers: [NewsController, TeamNewsController],
	providers: [NewsUc, NewsRepo, DeleteUserReferenceFromNewsStep],
	exports: [NewsUc],
})
export class NewsModule {}
