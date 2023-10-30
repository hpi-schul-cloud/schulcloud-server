import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Account } from '@shared/domain/entity/account.entity';
import { Role } from '@shared/domain/entity/role.entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { SchoolYearEntity } from '@shared/domain/entity/schoolyear.entity';
import { SystemEntity } from '@shared/domain/entity/system.entity';
import { User } from '@shared/domain/entity/user.entity';
import { createConfigModuleOptions } from '@src/config/config-module-options';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config/database.config';
import { CoreModule } from '@src/core/core.module';
import { Logger } from '@src/core/logger/logger';
import { AuthenticationModule } from '../authentication/authentication.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { H5PEditorController } from './controller/h5p-editor.controller';
import { config } from './h5p-editor.config';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

const imports = [
	AuthenticationModule,
	AuthorizationModule,
	CoreModule,
	MikroOrmModule.forRoot({
		...defaultMikroOrmOptions,
		type: 'mongo',
		// TODO add mongoose options as mongo options (see database.js)
		clientUrl: DB_URL,
		password: DB_PASSWORD,
		user: DB_USERNAME,
		entities: [User, Account, Role, SchoolEntity, SystemEntity, SchoolYearEntity],

		// debug: true, // use it for locally debugging of querys
	}),
	ConfigModule.forRoot(createConfigModuleOptions(config)),
];

const controllers = [H5PEditorController];

const providers = [Logger];

@Module({
	imports,
	controllers,
	providers,
})
export class H5PEditorModule {}
