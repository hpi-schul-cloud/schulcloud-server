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
import { NotificationApiModule } from './notification-api.module';
import { NotificationEntity } from './repo/entities';
import { DEFAULT_TIMEOUT_CONFIG_TOKEN } from '@core/interceptor/default-timeout.config';

const imports = [
	CoreModule,
	NotificationApiModule,
	AuthGuardModule.register([
		{
			option: AuthGuardOptions.JWT,
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

const ENTITIES = [NotificationEntity];

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
export class NotificationServerModule {}

@Module({
	imports: [
		...imports,
		MongoMemoryDatabaseModule.forRoot({
			entities: ENTITIES,
		}),
	],
})
export class NotificationServerTestModule {}
