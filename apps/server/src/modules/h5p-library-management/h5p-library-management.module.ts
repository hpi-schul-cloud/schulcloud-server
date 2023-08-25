import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { Account, Role, School, SchoolYear, System, User } from '@shared/domain';
import { RabbitMQWrapperModule } from '@shared/infra/rabbitmq';

import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';

import { LibraryStorage } from '../h5p-editor/service';

import { UserModule } from '..';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

const imports = [
	CoreModule,
	UserModule,
	RabbitMQWrapperModule,
	MikroOrmModule.forRoot({
		...defaultMikroOrmOptions,
		type: 'mongo',
		// TODO add mongoose options as mongo options (see database.js)
		clientUrl: DB_URL,
		password: DB_PASSWORD,
		user: DB_USERNAME,
		entities: [User, Account, Role, School, System, SchoolYear],
	}),
];

const controllers = [];

const providers = [Logger, LibraryStorage];

@Module({
	imports,
	controllers,
	providers,
})
export class H5PLibraryManagementModule {}
