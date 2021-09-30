import { Module, NotFoundException } from '@nestjs/common';
import { DatabaseManagementService } from '@shared/infra/database/management/database-management.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { DatabaseManagementController } from './controller/database-management.controller';
import { DatabaseManagementUc } from './uc/database-management.uc';
import { BsonConverter } from './converter/bson.converter';
import { FileSystemModule } from '../../shared/infra/file-system/file-system.module';
import { DatabaseManagementConsole } from './console/database-management.console';
import { DatabaseManagementModule } from '../../shared/infra/database/management/database-management.module';
import { ConsoleWriter } from '../../shared/infra/console/console-writer/console-writer.service';
import { UserInfo } from '../news/entity';
import { DB_URL, DB_USERNAME, DB_PASSWORD } from '../../config';

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
			// TODO just needed any entity to start
			entities: [UserInfo],
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
		ConsoleWriter,
	],
	controllers: [DatabaseManagementController],
})
export class ManagementModule {}
