import { ConsoleWriterModule } from '@infra/console';
import { BoardModule } from '@modules/board';
import { LearnroomModule } from '@modules/learnroom';
import { LessonModule } from '@modules/lesson';
import { TaskModule } from '@modules/task';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { H5PEditorModule } from '@modules/h5p-editor';
import metaTagExtractorConfig from './meta-tag-extractor.config';
import { MetaTagExtractorService } from './service';
import { MetaTagInternalUrlService } from './service/meta-tag-internal-url.service';
import {
	BoardUrlHandler,
	CourseUrlHandler,
	H5pUrlHandler,
	LessonUrlHandler,
	TaskUrlHandler,
} from './service/url-handler';

@Module({
	imports: [
		BoardModule,
		ConsoleWriterModule,
		H5PEditorModule,
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
		H5pUrlHandler,
	],
	exports: [MetaTagExtractorService],
})
export class MetaTagExtractorModule {}
