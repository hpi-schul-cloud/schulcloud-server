import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsoleWriterModule } from '@infra/console';
import { createConfigModuleOptions } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '../authentication/authentication.module';
import { BoardModule } from '../board';
import { LearnroomModule } from '../learnroom';
import { LessonModule } from '../lesson';
import { TaskModule } from '../task';
import { UserModule } from '../user';
import metaTagExtractorConfig from './meta-tag-extractor.config';
import { MetaTagExtractorService } from './service';
import { MetaTagInternalUrlService } from './service/meta-tag-internal-url.service';
import { BoardUrlHandler, CourseUrlHandler, LessonUrlHandler, TaskUrlHandler } from './service/url-handler';

@Module({
	imports: [
		AuthenticationModule,
		BoardModule,
		ConsoleWriterModule,
		HttpModule,
		LearnroomModule,
		LessonModule,
		LoggerModule,
		TaskModule,
		UserModule,
		ConfigModule.forRoot(createConfigModuleOptions(metaTagExtractorConfig)),
	],
	providers: [
		MetaTagExtractorService,
		MetaTagInternalUrlService,
		TaskUrlHandler,
		LessonUrlHandler,
		CourseUrlHandler,
		BoardUrlHandler,
	],
	exports: [MetaTagExtractorService],
})
export class MetaTagExtractorModule {}
