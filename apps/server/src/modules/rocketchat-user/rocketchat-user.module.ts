import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { RocketChatModule } from '@modules/rocketchat/';
import { RocketChatUserRepo } from './repo';
import { RocketChatUserService } from './service/rocket-chat-user.service';

@Module({
	imports: [CqrsModule, LoggerModule, RocketChatModule],
	providers: [RocketChatUserRepo, RocketChatUserService],
	exports: [RocketChatUserService],
})
export class RocketChatUserModule {}
