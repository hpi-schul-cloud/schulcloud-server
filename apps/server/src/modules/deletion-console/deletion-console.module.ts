import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { HttpModule } from '@nestjs/axios';
import { ConsoleWriterModule } from '@infra/console';
import { UserModule } from '@modules/user';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { defaultMikroOrmOptions } from '@modules/server';
import { AccountModule } from '@modules/account';
import { getDeletionClientConfig } from './deletion-client/deletion-client.config';
import { FileEntity } from '../files/entity';
import { DeletionClient } from './deletion-client';
import { DeletionQueueConsole } from './deletion-queue.console';
import { BatchDeletionUc, DeletionExecutionUc } from './uc';
import { BatchDeletionService } from './services';
import { DeletionExecutionConsole } from './deletion-execution.console';

@Module({
	imports: [
		ConsoleModule,
		ConsoleWriterModule,
		UserModule,
		ConfigModule.forRoot(createConfigModuleOptions(getDeletionClientConfig)),
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			allowGlobalContext: true,
			entities: [...ALL_ENTITIES, FileEntity],
			debug: true,
		}),
		AccountModule,
		HttpModule,
	],
	providers: [
		DeletionClient,
		DeletionQueueConsole,
		BatchDeletionUc,
		BatchDeletionService,
		DeletionExecutionConsole,
		DeletionExecutionUc,
	],
})
export class DeletionConsoleModule {}
