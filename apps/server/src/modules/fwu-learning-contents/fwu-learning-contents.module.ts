import { Module, NotFoundException } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules/authorization';
import { HttpModule } from '@nestjs/axios';
import { CoreModule } from '@src/core';
import { ConfigModule } from '@nestjs/config';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Account, User, Role, School, System, SchoolYear } from '@shared/domain';
import { createConfigModuleOptions, DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { Logger } from '@src/core/logger';
import { s3Config, config } from './fwu-learning-contents.config';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';

const providers = [
	Logger,
	{
		provide: 'S3_Config',
		useValue: s3Config,
	},
	FwuLearningContentsUc,
];

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

@Module({
	imports: [
		AuthorizationModule,
		AuthenticationModule,
		CoreModule,
		HttpModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [User, Account, Role, School, System, SchoolYear],

			// debug: true, // use it for locally debugging of querys
		}),
		ConfigModule.forRoot(createConfigModuleOptions(config)),
	],
	controllers: [FwuLearningContentsController],
	providers,
})
export class FwuLearningContentsModule {}
