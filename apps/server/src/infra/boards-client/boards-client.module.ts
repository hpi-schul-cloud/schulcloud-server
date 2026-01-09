import { Module } from '@nestjs/common';
import { BoardsClientAdapter } from './boards-client.adapter';

@Module({
	providers: [BoardsClientAdapter],
	exports: [BoardsClientAdapter],
})
export class BoardsClientModule {}
