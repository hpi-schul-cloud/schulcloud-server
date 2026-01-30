import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { serverConfig } from '@modules/server';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';

@Module({
	imports: [
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: HealthEntities,
		}),
		HealthApiModule,
		ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
	],
})
export class InternalServerModule {}
