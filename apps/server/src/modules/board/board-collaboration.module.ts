import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defaultMikroOrmOptions } from '@modules/server';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { createConfigModuleOptions, DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { ConsoleWriterModule } from '@src/infra/console';
import { RabbitMQWrapperModule } from '@src/infra/rabbitmq';
import { config } from './board-collaboration.config';
import { BoardModule } from './board.module';
import { SocketGateway } from './gateway/socket.gateway';

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
