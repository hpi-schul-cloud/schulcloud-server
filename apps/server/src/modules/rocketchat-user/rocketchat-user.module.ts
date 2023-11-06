import { Module } from '@nestjs/common';
import { RocketChatUserRepo } from './repo';

@Module({
	providers: [RocketChatUserRepo],
	exports: [],
})
export class RocketChatUserModule {}
