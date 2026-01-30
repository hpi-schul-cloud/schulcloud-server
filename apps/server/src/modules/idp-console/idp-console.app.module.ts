import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { ConsoleWriterModule } from '@infra/console';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { SCHULCONNEX_CLIENT_CONFIG_TOKEN, SchulconnexClientConfig } from '@infra/schulconnex-client';
import { SchulconnexClientModule } from '@infra/schulconnex-client/schulconnex-client.module';
import { AccountModule } from '@modules/account';
import { SynchronizationModule } from '@modules/synchronization';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { IdpSyncConsole, SynchronizationUc } from './api';
import { IDP_CONSOLE_CONFIG_TOKEN, IdpConsoleConfig } from './idp-console.config';
import { ENTITIES } from './idp.entity.imports';

@Module({
	imports: [
		ConfigurationModule.register(IDP_CONSOLE_CONFIG_TOKEN, IdpConsoleConfig),
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
