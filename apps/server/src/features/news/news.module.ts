import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsRepo } from './repo/news.repo';
import { NewsController } from './controller/news.controller';
import { NewsSchema } from './repo/schema/news.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorizationModule } from '../../modules/authorization/authorization.module';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'News', schema: NewsSchema }]), AuthorizationModule],
	controllers: [NewsController],
	providers: [NewsService, NewsRepo],
	exports: [NewsService],
})
export class NewsModule {}
