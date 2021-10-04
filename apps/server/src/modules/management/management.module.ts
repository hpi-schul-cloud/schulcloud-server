import { Module, NotFoundException } from '@nestjs/common';
import { DatabaseManagementService, DatabaseManagementModule } from '@shared/infra/database';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { ALL_ENTITIES } from '@shared/domain';
import { FileSystemModule } from '@shared/infra/file-system';

import { ConsoleWriterService } from '@shared/infra/console';
import { DB_URL, DB_USERNAME, DB_PASSWORD } from '@src/config';
import { DatabaseManagementController } from './controller/database-management.controller';
import { DatabaseManagementUc } from './uc/database-management.uc';
import { BsonConverter } from './converter/bson.converter';
import { DatabaseManagementConsole } from './console/database-management.console';

@Module({
	imports: [
		FileSystemModule,
		DatabaseManagementModule,
		MikroOrmModule.forRoot({
			// TODO repeats server module definitions
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ALL_ENTITIES,
			findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
			},
		}),
	],
	providers: [
		DatabaseManagementUc,
		DatabaseManagementService,
		BsonConverter,
		// console providers
		DatabaseManagementConsole,
		// infra services
		ConsoleWriterService,
	],
	controllers: [DatabaseManagementController],
})
export class ManagementModule {}
