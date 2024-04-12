import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { SocketGateway } from './gateway/socket.gateway';
import { config } from './board-collaboration.config';

@Module({
	imports: [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))],
	providers: [SocketGateway],
	exports: [],
})
export class BoardCollaborationModule {}
