import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { ConsoleWriterModule } from '@infra/console';
import { SchulconnexClientModule } from '@infra/schulconnex-client/schulconnex-client.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AccountModule } from '@modules/account';
import { SynchronizationModule } from '@modules/synchronization';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { ConsoleModule } from 'nestjs-console';
import { IdpSyncConsole, SynchronizationUc } from './api';
import { idpConsoleConfigConfig } from './idp-console.config';
import { ENTITIES } from './idp.entity.imports';

@Module({
	imports: [
		ConfigModule.forRoot(createConfigModuleOptions(idpConsoleConfigConfig)),
		SchulconnexClientModule.registerAsync(),
		SynchronizationModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			allowGlobalContext: true,
			entities: ENTITIES,
			// debug: true, // use it for locally debugging of queries
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
