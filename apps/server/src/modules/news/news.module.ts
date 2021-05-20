import { Module } from '@nestjs/common';
import { NewsUc } from './uc/news.uc';
import { NewsRepo } from './repo/news.repo';
import { NewsController } from './controller/news.controller';
import { AuthorizationModule } from '../authorization/authorization.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
	imports: [AuthorizationModule, LoggerModule],
	controllers: [NewsController],
	providers: [NewsUc, NewsRepo],
	exports: [NewsUc],
})
export class NewsModule {}
