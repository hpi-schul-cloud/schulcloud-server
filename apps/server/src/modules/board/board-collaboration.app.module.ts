import { CoreModule } from '@core/core.module';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { ValkeyClientModule, ValkeyConfig } from '@infra/valkey-client';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SESSION_VALKEY_CLIENT } from '@modules/authentication/authentication-config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { AuthorizationModule } from '../authorization';
import { ServerConfig, serverConfig } from '../server';
import { BoardCollaborationConfig, config } from './board-collaboration.config';
import { BoardWsApiModule } from './board-ws-api.module';
import { ENTITIES, TEST_ENTITIES } from './board.entity.imports';
import { BoardModule } from './board.module';
import { MongoDriver } from '@mikro-orm/mongodb';

const createValkeyModuleOptions = (configService: ConfigService<BoardCollaborationConfig>): ValkeyConfig => {
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
	CoreModule,
	RabbitMQWrapperModule,
	BoardModule,
	AuthorizationModule,
	BoardWsApiModule,
	AuthGuardModule.register([AuthGuardOptions.WS_JWT]),
	ValkeyClientModule.registerAsync({
		injectionToken: SESSION_VALKEY_CLIENT,
		useFactory: createValkeyModuleOptions,
		inject: [ConfigService],
	}),
];

@Module({
	imports: [
		...imports,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			driver: MongoDriver,
			clientUrl: DB_URL, // TODO: check if this needs to be different
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ENTITIES,
		}),
	],
	providers: [],
	exports: [],
})
export class BoardCollaborationModule {}

const testConfig = (): ServerConfig & BoardCollaborationConfig => {
	return { ...serverConfig(), ...config() };
};

@Module({
	imports: [
		...imports,
		ConfigModule.forRoot(createConfigModuleOptions(testConfig)),
		MongoMemoryDatabaseModule.forRoot({
			...defaultMikroOrmOptions,
			entities: TEST_ENTITIES,
		}),
	],
})
export class BoardCollaborationTestModule {}
