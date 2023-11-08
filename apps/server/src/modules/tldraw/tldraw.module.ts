import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions, DB_PASSWORD, DB_USERNAME, DB_URL } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { TldrawBoardRepo } from './repo';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { TldrawDrawing } from '@src/modules/tldraw/entities';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { config } from './config';
import { TldrawController } from './controller/tldraw.controller';
import {TldrawService} from "./service/tldraw.service";
import {TldrawRepo} from "./repo/tldraw.repo";
import {AuthorizationModule} from "@modules/authorization";

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
	RabbitMQWrapperTestModule,
	MikroOrmModule.forRoot({
		...defaultMikroOrmOptions,
		type: 'mongo',
		clientUrl: DB_URL,
		password: DB_PASSWORD,
		user: DB_USERNAME,
		entities: [TldrawDrawing],
	}),
	ConfigModule.forRoot(createConfigModuleOptions(config)),
],
	providers: [Logger, TldrawService, TldrawBoardRepo, TldrawRepo],
	controllers: [TldrawController],
})
export class TldrawModule {}
