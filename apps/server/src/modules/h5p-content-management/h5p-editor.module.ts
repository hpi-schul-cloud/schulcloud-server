import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { S3ClientModule } from '@infra/s3-client';
import { H5PAjaxEndpoint, H5PEditor, H5PPlayer } from '@lumieducation/h5p-server';
import { Module } from '@nestjs/common';
import { H5P_CACHE_CONFIG_TOKEN, H5PCacheConfig } from './h5p-cache.config';
import { H5P_CONTENT_S3_CLIENT_CONFIG_TOKEN, H5PContentS3ClientConfig } from './h5p-content-s3-client.config';
import { H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig } from './h5p-editor.config';
import { H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN, H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN } from './h5p-editor.const';
import { H5P_LIBRARIES_S3_CLIENT_CONFIG_TOKEN, H5PLibrariesS3ClientConfig } from './h5p-libraries-s3-client.config';
import { H5PAjaxEndpointProvider, H5PCacheProvider, H5PEditorProvider, H5PPlayerProvider } from './provider';
import { H5PContentRepo, LibraryRepo } from './repo';
import { ContentStorage, H5pEditorContentService, LibraryStorage, TemporaryFileStorage } from './service';

@Module({
	imports: [
		S3ClientModule.register({
			clientInjectionToken: H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN,
			configInjectionToken: H5P_CONTENT_S3_CLIENT_CONFIG_TOKEN,
			configConstructor: H5PContentS3ClientConfig,
		}),
		S3ClientModule.register({
			clientInjectionToken: H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN,
			configInjectionToken: H5P_LIBRARIES_S3_CLIENT_CONFIG_TOKEN,
			configConstructor: H5PLibrariesS3ClientConfig,
		}),
		ConfigurationModule.register(H5P_CACHE_CONFIG_TOKEN, H5PCacheConfig),
		ConfigurationModule.register(H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig),
		LoggerModule,
	],
	providers: [
		H5PContentRepo,
		LibraryRepo,
		H5PCacheProvider,
		H5PEditorProvider,
		H5PPlayerProvider,
		H5PAjaxEndpointProvider,
		ContentStorage,
		LibraryStorage,
		TemporaryFileStorage,
		H5pEditorContentService,
	],
	exports: [
		ContentStorage,
		LibraryStorage,
		H5PEditor,
		H5PPlayer,
		H5PAjaxEndpoint,
		H5PContentRepo,
		H5pEditorContentService,
	],
})
export class H5PEditorModule {}
