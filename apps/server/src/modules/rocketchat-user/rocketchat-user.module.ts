import { LoggerModule } from '@core/logger';
import { RocketChatModule } from '@modules/rocketchat/rocket-chat.module';
import { SagaModule } from '@modules/saga';
import { Module } from '@nestjs/common';
import { RocketChatUserRepo } from './repo';
import { DeleteUserRocketChatDataStep } from './saga';
import { RocketChatUserService } from './service/rocket-chat-user.service';

@Module({
	imports: [LoggerModule, RocketChatModule, SagaModule],
	providers: [RocketChatUserRepo, RocketChatUserService, DeleteUserRocketChatDataStep],
	exports: [RocketChatUserService],
})
export class RocketChatUserModule {}
