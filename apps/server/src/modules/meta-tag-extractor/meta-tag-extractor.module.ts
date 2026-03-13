import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { ConsoleWriterModule } from '@infra/console';
import { BoardModule } from '@modules/board';
import { CourseModule } from '@modules/course';
import { LessonModule } from '@modules/lesson';
import { TaskModule } from '@modules/task';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { META_TAG_EXTRACTOR_CONFIG_TOKEN, MetaTagExtractorConfig } from './meta-tag-extractor.config';
import { MetaTagExtractorService } from './service';
import { MetaTagExternalUrlService } from './service/meta-tag-external-url.service';
import { MetaTagInternalUrlService } from './service/meta-tag-internal-url.service';
import { BoardUrlHandler, CourseUrlHandler, LessonUrlHandler, TaskUrlHandler } from './service/url-handler';

@Module({
	imports: [
		BoardModule,
		ConsoleWriterModule,
		HttpModule,
		CourseModule,
		LessonModule,
		LoggerModule,
		TaskModule,
		UserModule,
		ConfigurationModule.register(META_TAG_EXTRACTOR_CONFIG_TOKEN, MetaTagExtractorConfig),
	],
	providers: [
		MetaTagExtractorService,
		MetaTagExternalUrlService,
		MetaTagInternalUrlService,
		TaskUrlHandler,
		LessonUrlHandler,
		CourseUrlHandler,
		BoardUrlHandler,
	],
	exports: [MetaTagExtractorService],
})
export class MetaTagExtractorModule {}
