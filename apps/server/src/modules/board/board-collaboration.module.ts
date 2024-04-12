import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { SocketGateway } from './gateway/socket.gateway';

@Module({
	imports: [LoggerModule],
	providers: [SocketGateway],
	exports: [],
})
export class BoardCollaborationModule {}
