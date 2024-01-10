import { Module } from '@nestjs/common';
import { RocketChatUserRepo } from './repo';
import { RocketChatUserService } from './service/rocket-chat-user.service';

@Module({
	providers: [RocketChatUserRepo, RocketChatUserService],
	exports: [RocketChatUserService],
})
export class RocketChatUserModule {}
