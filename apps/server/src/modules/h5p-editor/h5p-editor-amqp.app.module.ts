import { CoreModule } from '@core/core.module';
import { Logger } from '@core/logger';
import {
	AUTHORIZATION_CLIENT_CONFIG_TOKEN,
	AuthorizationClientConfig,
	AuthorizationClientModule,
} from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { H5P_EXCHANGE_CONFIG_TOKEN, H5pExchangeConfig } from '@infra/h5p-editor-client';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig, RabbitMQWrapperModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { H5pEditorConsumer } from './controller';
import { H5P_CACHE_CONFIG_TOKEN, H5PCacheConfig } from './h5p-cache.config';
import { H5P_CONTENT_S3_CLIENT_CONFIG_TOKEN, H5PContentS3ClientConfig } from './h5p-content-s3-client.config';
import { coreConfig } from './h5p-editor.config';
import { H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN, H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN } from './h5p-editor.const';
import { ENTITIES } from './h5p-editor.entity.exports';
import { H5P_LIBRARIES_S3_CLIENT_CONFIG_TOKEN, H5PLibrariesS3ClientConfig } from './h5p-libraries-s3-client.config';
import { H5PAjaxEndpointProvider, H5PCacheProvider, H5PEditorProvider, H5PPlayerProvider } from './provider';
import { H5PContentRepo, LibraryRepo } from './repo';
import { ContentStorage, H5pEditorContentService, LibraryStorage, TemporaryFileStorage } from './service';
import { H5PEditorUc } from './uc';

const imports = [
	ConfigModule.forRoot(createConfigModuleOptions(coreConfig)),
	CoreModule,
	AuthorizationClientModule.register(AUTHORIZATION_CLIENT_CONFIG_TOKEN, AuthorizationClientConfig),
	UserModule,
	DatabaseModule.register({
		configInjectionToken: DATABASE_CONFIG_TOKEN,
		configConstructor: DatabaseConfig,
		entities: [...ENTITIES, ...HealthEntities],
	}),
	RabbitMQWrapperModule.register({
		exchangeConfigInjectionToken: H5P_EXCHANGE_CONFIG_TOKEN,
		exchangeConfigConstructor: H5pExchangeConfig,
		configInjectionToken: RABBITMQ_CONFIG_TOKEN,
		configConstructor: RabbitMQConfig,
	}),
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
	ConfigurationModule.register(H5P_EXCHANGE_CONFIG_TOKEN, H5pExchangeConfig),
	HealthApiModule,
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
	H5pEditorConsumer,
	H5pEditorContentService,
];

@Module({
	imports,
	controllers,
	providers,
})
export class H5PEditorAMQPModule {}
