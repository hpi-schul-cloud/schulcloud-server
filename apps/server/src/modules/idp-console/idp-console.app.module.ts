import { ConsoleWriterModule } from '@infra/console';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { SchulconnexClientModule } from '@infra/schulconnex-client/schulconnex-client.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AccountModule } from '@modules/account';
import { SynchronizationEntity, SynchronizationModule } from '@modules/synchronization';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { createConfigModuleOptions, DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { ConsoleModule } from 'nestjs-console';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { idpConsoleConfigConfig } from './idp-console.config';
import { IdpSyncConsole, SynchronizationUc } from './api';

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
			entities: [...ALL_ENTITIES, SynchronizationEntity],
			// debug: true, // use it for locally debugging of queries
		}),
		UserModule,
		AccountModule,
		LoggerModule,
		RabbitMQWrapperModule,
		ConsoleWriterModule,
		ConsoleModule,
	],
	providers: [SynchronizationUc, IdpSyncConsole],
})
export class IdpConsoleModule {}
