import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthorizationModule } from '@modules/authorization';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { config, s3Config } from './fwu-learning-contents.config';
import { ENTITIES } from './fwu.entity.imports';
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
			entities: ENTITIES,

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
