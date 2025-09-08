import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { SagaModule } from '@modules/saga';
import { forwardRef, Module } from '@nestjs/common';
import { NewsController, NewsUc, TeamNewsController } from './api';
import { NewsRepo } from './repo/news.repo';
import { DeleteUserNewsDataStep } from './saga';

// imports from deletion module?
@Module({
	imports: [LoggerModule, forwardRef(() => AuthorizationModule), SagaModule],
	controllers: [NewsController, TeamNewsController],
	providers: [NewsUc, NewsRepo, DeleteUserNewsDataStep],
	exports: [NewsUc],
})
export class NewsModule {}
