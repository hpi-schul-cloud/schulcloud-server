import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions, DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { SocketGateway } from './gateway/socket.gateway';
import { config } from './board-collaboration.config';
import { ConsoleWriterModule } from '@src/infra/console';
import { BoardModule } from './board.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { defaultMikroOrmOptions } from '../server';
import { RabbitMQWrapperModule } from '@src/infra/rabbitmq';

@Module({
	imports: [
		CoreModule,
		RabbitMQWrapperModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		ConsoleWriterModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: DB_URL, // TODO: check if this needs to be different
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ALL_ENTITIES,
		}),
		BoardModule,
	],
	providers: [SocketGateway],
	exports: [],
})
export class BoardCollaborationModule {}
