import { serverConfig } from '@modules/server';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { AuthGuardModule, AuthGuardOptions } from '@src/infra/auth-guard';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { RabbitMQWrapperTestModule } from '@src/infra/rabbitmq';
import { defaultMikroOrmOptions } from '@shared/common';
import { AuthenticationApiModule } from '../authentication/authentication-api.module';
import { AuthorizationModule } from '../authorization';
import { config as boardCollaborationConfig } from './board-collaboration.config';
import { BoardWsApiModule } from './board-ws-api.module';
import { BoardModule } from './board.module';

const config = () => {
	return { ...serverConfig(), ...boardCollaborationConfig() };
};

@Module({
	imports: [
		CoreModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		RabbitMQWrapperTestModule,
		MongoMemoryDatabaseModule.forRoot({
			...defaultMikroOrmOptions,
			entities: ALL_ENTITIES,
		}),
		BoardModule,
		AuthorizationModule,
		AuthenticationApiModule,
		BoardWsApiModule,
		AuthGuardModule.register([AuthGuardOptions.WS_JWT]),
	],
	providers: [],
	exports: [],
})
export class BoardCollaborationTestingModule {}
