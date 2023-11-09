import { Module } from '@nestjs/common';
import { RocketChatUserRepo } from './repo';
import { RocketChatUserService } from './service/rocket-chat-user.service';
import { RocketChatService } from '../rocketchat/rocket-chat.service';

@Module({
	providers: [RocketChatUserService, RocketChatUserRepo],
	exports: [RocketChatService],
})
export class RocketChatUserModule {}
