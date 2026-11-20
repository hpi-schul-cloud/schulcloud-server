import { CoreModule } from '@core/core.module';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { User } from '@modules/user';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { BoardImportApiModule } from './board-import-api.module';

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
	imports,
})
export class BoardImportApiAppModule {}

@Module({
	imports: [...imports, MongoMemoryDatabaseModule.forRoot({ entities: [User] })],
})
export class BoardImportApiTestModule {}
