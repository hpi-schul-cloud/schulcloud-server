import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { ConsoleWriterModule } from '@infra/console';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AccountModule } from '@modules/account';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { ConsoleModule } from 'nestjs-console';
import { DeletionClient } from './deletion-client';
import { ENTITIES, TEST_ENTITIES } from './deletion-console.entity.imports';
import { DeletionExecutionConsole } from './deletion-execution.console';
import { DeletionQueueConsole } from './deletion-queue.console';
import { deletionConsoleConfig } from './deletion.config';
import { BatchDeletionService } from './services';
import { BatchDeletionUc, DeletionExecutionUc } from './uc';
import { MongoMemoryDatabaseModule } from '@testing/database';
import path from 'path';

const deletionConsoleModules = [
	ConsoleModule,
	ConsoleWriterModule,
	UserModule,
	ConfigModule.forRoot(createConfigModuleOptions(deletionConsoleConfig)),
	AccountModule,
	HttpModule,
];

const providers = [
	DeletionClient,
	DeletionQueueConsole,
	BatchDeletionUc,
	BatchDeletionService,
	DeletionExecutionConsole,
	DeletionExecutionUc,
];
@Module({
	imports: [
		...deletionConsoleModules,
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
	],
	providers,
})
export class DeletionConsoleModule {}

@Module({
	imports: [
		...deletionConsoleModules,
		MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, entities: TEST_ENTITIES }),
	],
	providers,
})
export class DeletionConsoleTestModule {}

export const projectRoot = path.resolve(__dirname, '../../../../..');
