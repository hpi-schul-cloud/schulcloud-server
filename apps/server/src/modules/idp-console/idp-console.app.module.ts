import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import { ConsoleWriterModule } from '@infra/console';
import { SCHULCONNEX_CLIENT_CONFIG_TOKEN, SchulconnexClientConfig } from '@infra/schulconnex-client';
import { SchulconnexClientModule } from '@infra/schulconnex-client/schulconnex-client.module';
import { AccountModule } from '@modules/account';
import { SynchronizationModule } from '@modules/synchronization';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { ConsoleModule } from 'nestjs-console';
import { IdpSyncConsole, SynchronizationUc } from './api';
import { idpConsoleConfigConfig } from './idp-console.config';
import { ENTITIES } from './idp.entity.imports';
import { DatabaseModule, DATABASE_CONFIG_TOKEN, DatabaseConfig } from '@infra/database';

@Module({
	imports: [
		ConfigModule.forRoot(createConfigModuleOptions(idpConsoleConfigConfig)),
		SchulconnexClientModule.register(SCHULCONNEX_CLIENT_CONFIG_TOKEN, SchulconnexClientConfig),
		SynchronizationModule,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
		}),
		UserModule,
		AccountModule,
		LoggerModule,
		ConsoleWriterModule,
		ConsoleModule,
		ErrorModule,
	],
	providers: [SynchronizationUc, IdpSyncConsole],
})
export class IdpConsoleModule {}
