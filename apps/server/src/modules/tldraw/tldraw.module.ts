import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Course, User } from '@shared/domain';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { AuthenticationModule } from '../authentication/authentication.module';
import { config } from './tldraw.config';
import { TldrawGateway } from '@src/modules/tldraw/gateway';

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
		entities: [User, Course],

		// debug: true, // use it for locally debugging of querys
	}),
	ConfigModule.forRoot(createConfigModuleOptions(config)),
];

@Module({
	imports,
	providers: [Logger, TldrawGateway],
})
export class TldrawModule {}
