import { CoreModule } from '@core/core.module';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { User } from '@modules/user';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { BoardImportApiModule } from './board-import-api.module';
import { ENTITIES } from './board-import.entity.imports';

const imports = [
	CoreModule,
	AuthGuardModule.register([
		{
			option: AuthGuardOptions.JWT,
			configInjectionToken: JWT_AUTH_GUARD_CONFIG_TOKEN,
			configConstructor: JwtAuthGuardConfig,
		},
	]),
	BoardImportApiModule,
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
})
export class BoardImportApiAppModule {}

@Module({
	imports: [...imports, MongoMemoryDatabaseModule.forRoot({ entities: [User, ...ENTITIES] })],
})
export class BoardImportApiTestModule {}
