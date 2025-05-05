import { LoggerModule } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';
import { RocketChatModule } from '@modules/rocketchat/rocket-chat.module';
import { SagaModule } from '@modules/saga';
import { Module } from '@nestjs/common';
import { RocketChatUserRepo } from './repo';
import { RocketChatUserService } from './service/rocket-chat-user.service';

@Module({
	imports: [
		LoggerModule,
		RocketChatModule.forRoot({
			uri: Configuration.get('ROCKET_CHAT_URI') as string,
			adminId: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
			adminToken: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
			adminUser: Configuration.get('ROCKET_CHAT_ADMIN_USER') as string,
			adminPassword: Configuration.get('ROCKET_CHAT_ADMIN_PASSWORD') as string,
		}),
		SagaModule,
	],
	providers: [RocketChatUserRepo, RocketChatUserService],
	exports: [RocketChatUserService],
})
export class RocketChatUserModule {}
