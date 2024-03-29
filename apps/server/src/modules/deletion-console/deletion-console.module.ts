import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ConsoleModule } from 'nestjs-console';
import { ConsoleWriterModule } from '@infra/console';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { CqrsModule } from '@nestjs/cqrs';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { RoleRepo, UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { LoggerModule } from '@src/core/logger';
import { DeletionClient } from './deletion-client';
import { getDeletionClientConfig } from './deletion-client/deletion-client.config';
import { DeletionQueueConsole } from './deletion-queue.console';
import { DeletionExecutionConsole } from './deletion-execution.console';
import { BatchDeletionService } from './services';
import { BatchDeletionUc, DeletionExecutionUc } from './uc';
import { UserService } from '../user';
import { AccountModule } from '../account';
import { defaultMikroOrmOptions } from '../server';
import { FileEntity } from '../files/entity';
import { RoleService } from '../role';
import { RegistrationPinService } from '../registration-pin';
import { RegistrationPinRepo } from '../registration-pin/repo';

@Module({
	imports: [
		ConsoleModule,
		ConsoleWriterModule,
		HttpModule,
		ConfigModule.forRoot(createConfigModuleOptions(getDeletionClientConfig)),
		AccountModule,
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
		LoggerModule,
		CqrsModule,
	],
	providers: [
		DeletionClient,
		BatchDeletionService,
		BatchDeletionUc,
		DeletionExecutionUc,
		DeletionQueueConsole,
		DeletionExecutionConsole,
		UserService,
		UserRepo,
		UserDORepo,
		RoleService,
		RegistrationPinService,
		RoleRepo,
		RegistrationPinRepo,
	],
})
export class DeletionConsoleModule {}
