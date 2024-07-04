import { defaultMikroOrmOptions, serverConfig } from '@modules/server';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { RabbitMQWrapperModule } from '@src/infra/rabbitmq';
import { AuthenticationModule } from '../authentication';
import { AuthenticationApiModule } from '../authentication/authentication-api.module';
import { AuthorizationModule } from '../authorization';
import { BoardWsApiModule } from './board-ws-api.module';
import { BoardModule } from './board.module';
import { config as boardCollaborationConfig } from './board-collaboration.config';

const config = () => {
	return { ...serverConfig(), ...boardCollaborationConfig() };
};

@Module({
	imports: [
		CoreModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		RabbitMQWrapperModule,
		MongoMemoryDatabaseModule.forRoot({
			...defaultMikroOrmOptions,
			entities: ALL_ENTITIES,
		}),
		BoardModule,
		AuthorizationModule,
		AuthenticationModule,
		AuthenticationApiModule,
		BoardWsApiModule,
	],
	providers: [],
	exports: [],
})
export class BoardCollaborationTestingModule {}
