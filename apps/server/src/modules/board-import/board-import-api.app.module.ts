import { CoreModule } from '@core/core.module';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { BoardImportTaskcardsModule } from '@modules/board-import-taskcards/board-import-taskcards.module';
import { User } from '@modules/user';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { BoardImportApiModule } from './board-import-api.module';
import { API_ENTITIES } from './board-import-api.entity.imports';

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
	BoardImportTaskcardsModule,
];

@Module({
	imports: [
		...imports,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: API_ENTITIES,
		}),
	],
})
export class BoardImportApiAppModule {}

@Module({
	imports: [...imports, MongoMemoryDatabaseModule.forRoot({ entities: [User, ...API_ENTITIES] })],
})
export class BoardImportApiTestModule {}
