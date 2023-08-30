import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions, DB_PASSWORD, DB_USERNAME, TLDRAW_DB_URL } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger, LoggerModule } from '@src/core/logger';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TldrawDrawing } from '@src/modules/tldraw/entities';
import { defaultMikroOrmOptions } from '@src/modules/server';
import { TldrawService } from '@src/modules/tldraw/service/tldraw.service';
import { TldrawRepo } from '@src/modules/tldraw/repo/tldraw.repo';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthenticationApiModule } from '@src/modules/authentication/authentication-api.module';
import { AuthorizationModule } from '@src/modules';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq';
import { config } from './config';
import { TldrawController } from './controller/tldraw.controller';

@Module({
	imports: [
		CoreModule,
		AuthenticationApiModule,
		AuthorizationModule,
		AuthenticationModule,
		CoreModule,
		LoggerModule,
		RabbitMQWrapperTestModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: TLDRAW_DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [TldrawDrawing],
		}),
	],
	providers: [Logger, TldrawService, TldrawRepo],
	controllers: [TldrawController],
	exports: [TldrawService],
})
export class TldrawModule {}
