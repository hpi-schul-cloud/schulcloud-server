import { S3Client } from '@aws-sdk/client-s3';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { HttpModule } from '@nestjs/axios';
import { Module, NotFoundException, Scope } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Account, Role, School, SchoolYear, System, User } from '@shared/domain';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { S3ClientAdapter } from '../files-storage/client/s3-client.adapter';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { config, s3Config } from './fwu-learning-contents.config';
import { S3Config } from './interface/config';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';

const providers = [
	{
		provide: 'S3_Client',
		scope: Scope.REQUEST,
		useFactory: (configProvider: S3Config) =>
			new S3Client({
				region: configProvider.region,
				credentials: {
					accessKeyId: configProvider.accessKeyId,
					secretAccessKey: configProvider.secretAccessKey,
				},
				endpoint: configProvider.endpoint,
				forcePathStyle: true,
				tls: true,
			}),
		inject: ['S3_Config'],
	},
	{
		provide: 'S3_Config',
		useValue: s3Config,
	},
	FwuLearningContentsUc,
	S3ClientAdapter,
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
		LoggerModule,
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
