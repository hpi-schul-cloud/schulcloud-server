import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsRepoService } from './repos/news-repo.service';
import { NewsController } from './news.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { News, NewsSchema } from './repos/schemas/news.schema';

@Module({
	imports: [MongooseModule.forFeature([{ name: News.name, schema: NewsSchema }])],
	controllers: [NewsController],
	providers: [NewsService, NewsRepoService],
	exports: [NewsService],
})
export class NewsModule {}
