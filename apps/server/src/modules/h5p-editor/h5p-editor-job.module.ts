import { CoreModule } from '@core/core.module';
import { Logger } from '@core/logger';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import {
	AUTHORIZATION_CLIENT_CONFIG_TOKEN,
	AuthorizationClientConfig,
	AuthorizationClientModule,
} from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { S3ClientModule } from '@infra/s3-client';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { H5P_CACHE_CONFIG_TOKEN, H5PCacheConfig } from './h5p-cache.config';
import { H5P_CONTENT_S3_CLIENT_CONFIG_TOKEN, H5PContentS3ClientConfig } from './h5p-content-s3-client.config';
import { coreConfig } from './h5p-editor-timeout.config';
import { H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig } from './h5p-editor.config';
import { H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN, H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN } from './h5p-editor.const';
import { ENTITIES } from './h5p-editor.entity.exports';
import { H5P_LIBRARIES_S3_CLIENT_CONFIG_TOKEN, H5PLibrariesS3ClientConfig } from './h5p-libraries-s3-client.config';
import { H5PAjaxEndpointProvider, H5PCacheProvider, H5PEditorProvider, H5PPlayerProvider } from './provider';
import { H5PContentRepo, LibraryRepo } from './repo';
import { ContentStorage, H5pEditorContentService, LibraryStorage, TemporaryFileStorage } from './service';
import { H5PEditorUc } from './uc';

/**
 * H5P Editor module for cronjob usage - excludes RabbitMQ dependencies and consumer
 * This module provides the same functionality as H5PEditorModule but without RabbitMQ
 * message queue integration, making it suitable for cronjob and standalone script usage.
 *
 * It also uses coreConfig instead of the full config to exclude JWT authentication requirements.
 * Controllers are excluded since cronjobs don't serve HTTP endpoints.
 */

const imports = [
	AuthorizationClientModule.register(AUTHORIZATION_CLIENT_CONFIG_TOKEN, AuthorizationClientConfig),
	CoreModule,
	UserModule,
	MikroOrmModule.forRoot({
		...defaultMikroOrmOptions,
		type: 'mongo',
		// TODO add mongoose options as mongo options (see database.js)
		clientUrl: DB_URL,
		password: DB_PASSWORD,
		user: DB_USERNAME,
		allowGlobalContext: true,
		entities: ENTITIES,
		ensureIndexes: true,
	}),
	ConfigModule.forRoot(createConfigModuleOptions(coreConfig)),
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
];

const controllers = [];

const providers = [
	Logger,
	H5PEditorUc,
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
];

@Module({
	imports,
	controllers,
	providers,
	exports: [ContentStorage, LibraryStorage],
})
export class H5pEditorJobModule {}
