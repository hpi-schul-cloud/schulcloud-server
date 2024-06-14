import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defaultMikroOrmOptions } from '@modules/server';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { createConfigModuleOptions, DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { RabbitMQWrapperModule } from '@src/infra/rabbitmq';
import { AuthorizationModule } from '../authorization';
import { config } from './board-collaboration.config';
import { BoardWsApiModule } from './board-ws-api.module';
import { BoardModule } from './board.module';
import { AuthenticationModule } from '../authentication';

@Module({
	imports: [
		CoreModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		RabbitMQWrapperModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: DB_URL, // TODO: check if this needs to be different
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ALL_ENTITIES,
		}),
		BoardModule,
		AuthorizationModule,
		AuthenticationModule,
		BoardWsApiModule,
	],
	providers: [],
	exports: [],
})
export class BoardCollaborationModule {}
