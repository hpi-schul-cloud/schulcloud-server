import { CoreModule } from '@core/core.module';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import {
	SESSION_VALKEY_CLIENT_CONFIG_TOKEN,
	ValkeyClientModule,
	ValkeyClientSessionConfig,
} from '@infra/valkey-client';
import { SESSION_VALKEY_CLIENT } from '@modules/authentication';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { AuthorizationModule } from '../authorization';
import { BoardWsApiModule } from './board-ws-api.module';
import { ENTITIES, TEST_ENTITIES } from './board.entity.imports';
import { BoardModule } from './board.module';

const imports = [
	CoreModule,
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
	ValkeyClientModule.register({
		clientInjectionToken: SESSION_VALKEY_CLIENT,
		configConstructor: ValkeyClientSessionConfig,
		configInjectionToken: SESSION_VALKEY_CLIENT_CONFIG_TOKEN,
	}),
];

@Module({
	imports: [
		...imports,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
		}),
	],
	providers: [],
	exports: [],
})
export class BoardCollaborationModule {}

@Module({
	imports: [
		...imports,
		MongoMemoryDatabaseModule.forRoot({
			entities: TEST_ENTITIES,
		}),
	],
})
export class BoardCollaborationTestModule {}
