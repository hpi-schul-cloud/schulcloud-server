import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { SagaModule } from '@modules/saga';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { NewsRepo } from '@shared/repo/news';
import { NewsController } from './controller/news.controller';
import { TeamNewsController } from './controller/team-news.controller';
import { SagaInjectableService } from './service/saga-injectable.service';
import { NewsUc } from './uc/news.uc';

// imports from deletion module?
@Module({
	imports: [AuthorizationModule, CqrsModule, LoggerModule, forwardRef(() => SagaModule)],
	controllers: [NewsController, TeamNewsController],
	providers: [NewsUc, NewsRepo, SagaInjectableService],
	exports: [NewsUc, SagaInjectableService],
})
export class NewsModule {}
