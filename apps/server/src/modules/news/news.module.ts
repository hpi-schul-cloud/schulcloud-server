import { Module } from '@nestjs/common';
import { NewsUc } from './uc/news.uc';
import { NewsRepo } from './repo/news.repo';
import { NewsController } from './controller/news.controller';
import { AuthorizationModule } from '../authorization/authorization.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { News, SchoolInfo, UserInfo } from './entity';

@Module({
	imports: [AuthorizationModule],
	controllers: [NewsController],
	providers: [NewsUc, NewsRepo],
	exports: [NewsUc],
})
export class NewsModule {}
