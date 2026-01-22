import { CoreModule } from '@core/core.module';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { AuthorizationModule } from '../authorization';
import { serverConfig } from '../server';
import { BoardWsApiModule } from './board-ws-api.module';
import { ENTITIES, TEST_ENTITIES } from './board.entity.imports';
import { BoardModule } from './board.module';

const imports = [
	CoreModule,
	RabbitMQWrapperModule,
	BoardModule,
	AuthorizationModule,
	BoardWsApiModule,
	AuthGuardModule.register([
		{
			option: AuthGuardOptions.WS_JWT,
			configInjectionToken: JWT_AUTH_GUARD_CONFIG_TOKEN,
			configConstructor: JwtAuthGuardConfig,
		},
	]),
];

@Module({
	imports: [
		...imports,
		ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
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

const testConfig = () => {
	return { ...serverConfig() };
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
