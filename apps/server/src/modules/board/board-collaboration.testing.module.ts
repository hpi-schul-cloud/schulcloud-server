import { defaultMikroOrmOptions } from '@modules/server';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { ConsoleWriterModule } from '@src/infra/console';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { RabbitMQWrapperModule } from '@src/infra/rabbitmq';
import { AuthenticationModule } from '../authentication';
import { AuthorizationModule } from '../authorization';
import { config } from './board-collaboration.config';
import { BoardWsApiModule } from './board-ws-api.module';
import { BoardModule } from './board.module';

@Module({
	imports: [
		CoreModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		RabbitMQWrapperModule,
		ConsoleWriterModule,
		MongoMemoryDatabaseModule.forRoot({
			...defaultMikroOrmOptions,
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
export class BoardCollaborationTestingModule {}
