import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsoleWriterModule } from '@infra/console';
import { createConfigModuleOptions } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '../authentication/authentication.module';
import { UserModule } from '../user';
import metaTagExtractorConfig from './meta-tag-extractor.config';
import { MetaTagExtractorService } from './service';

@Module({
	imports: [
		AuthenticationModule,
		ConsoleWriterModule,
		HttpModule,
		LoggerModule,
		UserModule,
		ConfigModule.forRoot(createConfigModuleOptions(metaTagExtractorConfig)),
	],
	providers: [MetaTagExtractorService],
	exports: [MetaTagExtractorService],
})
export class MetaTagExtractorModule {}
