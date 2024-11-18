import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthorizationModule } from '@modules/authorization';
import { SystemEntity } from '@modules/system/entity';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Role, SchoolEntity, SchoolYearEntity, User } from '@shared/domain/entity';
import { createConfigModuleOptions, DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AccountEntity } from '@src/modules/account/domain/entity/account.entity';
import { defaultMikroOrmOptions } from '@shared/common';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { config, s3Config } from './fwu-learning-contents.config';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';

@Module({
	imports: [
		AuthorizationModule,
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
			entities: [User, AccountEntity, Role, SchoolEntity, SystemEntity, SchoolYearEntity],

			// debug: true, // use it for locally debugging of querys
		}),
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		S3ClientModule.register([s3Config]),
		AuthGuardModule.register([AuthGuardOptions.JWT]),
	],
	controllers: [FwuLearningContentsController],
	providers: [FwuLearningContentsUc],
})
export class FwuLearningContentsModule {}
