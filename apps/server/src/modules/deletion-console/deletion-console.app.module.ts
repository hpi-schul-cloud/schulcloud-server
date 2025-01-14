import { ConsoleWriterModule } from '@infra/console';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AccountModule } from '@modules/account';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/imports-from-feathers';
import { ConsoleModule } from 'nestjs-console';
import { FileEntity } from '../files/entity';
import { DeletionClient } from './deletion-client';
import { DeletionExecutionConsole } from './deletion-execution.console';
import { DeletionQueueConsole } from './deletion-queue.console';
import { deletionConsoleConfig } from './deletion.config';
import { BatchDeletionService } from './services';
import { BatchDeletionUc, DeletionExecutionUc } from './uc';

@Module({
	imports: [
		ConsoleModule,
		ConsoleWriterModule,
		UserModule,
		ConfigModule.forRoot(createConfigModuleOptions(deletionConsoleConfig)),
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			allowGlobalContext: true,
			entities: [...ALL_ENTITIES, FileEntity],
			// debug: true, // use it for locally debugging of queries
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
