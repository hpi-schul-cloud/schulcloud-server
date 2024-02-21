import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { AuthorizationModule } from '@modules/authorization';
import { HttpModule } from '@nestjs/axios';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Account, Role, SchoolEntity, SchoolYearEntity, SystemEntity, User } from '@shared/domain/entity';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '../authentication/authentication.module';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { config, s3Config } from './fwu-learning-contents.config';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';

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
		RabbitMQWrapperModule,
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
		S3ClientModule.register([s3Config]),
	],
	controllers: [FwuLearningContentsController],
	providers: [FwuLearningContentsUc],
})
export class FwuLearningContentsModule {}
