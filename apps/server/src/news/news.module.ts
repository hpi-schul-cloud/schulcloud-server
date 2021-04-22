import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsRepo } from './repos/news.repo';
import { NewsController } from './news.controller';
import { newsProviders } from './repos/provider/news.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
	imports: [DatabaseModule],
	controllers: [NewsController],
	providers: [NewsService, NewsRepo, ...newsProviders],
	exports: [NewsService],
})
export class NewsModule {}
