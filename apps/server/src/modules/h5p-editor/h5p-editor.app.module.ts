import { CoreModule } from '@core/core.module';
import { Logger } from '@core/logger';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { AccessTokenConfig } from '@infra/access-token/access-token.config';
import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { AuthorizationClientModule } from '@infra/authorization-client';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { ValkeyClientModule, ValkeyConfig } from '@infra/valkey-client';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { H5pEditorConsumer, H5PEditorController } from './controller';
import {
	authorizationClientConfig,
	CACHE_TOKEN,
	config,
	s3ConfigContent,
	s3ConfigLibraries,
} from './h5p-editor.config';
import { ENTITIES } from './h5p-editor.entity.exports';
import { H5PAjaxEndpointProvider, H5PEditorProvider, H5PPlayerProvider } from './provider';
import { H5PContentRepo, LibraryRepo } from './repo';
import { ContentStorage, H5pEditorContentService, LibraryStorage, TemporaryFileStorage } from './service';
import { H5PEditorUc } from './uc';

const createValkeyModuleOptions = (configService: ConfigService<AccessTokenConfig>): ValkeyConfig => {
	const config = {
		MODE: configService.getOrThrow('SESSION_VALKEY__MODE', { infer: true }),
		URI: configService.get('SESSION_VALKEY__URI', { infer: true }),
		SENTINEL_NAME: configService.get('SESSION_VALKEY__SENTINEL_NAME', { infer: true }),
		SENTINEL_PASSWORD: configService.get('SESSION_VALKEY__SENTINEL_PASSWORD', { infer: true }),
		SENTINEL_SERVICE_NAME: configService.get('SESSION_VALKEY__SENTINEL_SERVICE_NAME', { infer: true }),
	};

	return config;
};

const imports = [
	AuthorizationClientModule.register(authorizationClientConfig),
	CoreModule,
	UserModule,
	RabbitMQWrapperModule,
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
	ConfigModule.forRoot(createConfigModuleOptions(config)),
	S3ClientModule.register([s3ConfigContent, s3ConfigLibraries]),
	AuthGuardModule.register([AuthGuardOptions.JWT]),
	ValkeyClientModule.registerAsync({
		injectionToken: CACHE_TOKEN,
		useFactory: createValkeyModuleOptions,
		inject: [ConfigService],
	}),
];

const controllers = [H5PEditorController];

const providers = [
	Logger,
	H5PEditorUc,
	H5PContentRepo,
	LibraryRepo,
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
	exports: [ContentStorage, LibraryStorage],
})
export class H5PEditorModule {}
