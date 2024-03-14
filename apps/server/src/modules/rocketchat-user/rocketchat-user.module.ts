import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { Configuration } from '@hpi-schul-cloud/commons';
import { RocketChatModule } from '@modules/rocketchat';
import { RocketChatUserRepo } from './repo';
import { RocketChatUserService } from './service/rocket-chat-user.service';

@Module({
	imports: [
		CqrsModule,
		LoggerModule,
		RocketChatModule.forRoot({
			uri: Configuration.get('ROCKET_CHAT_URI') as string,
			adminId: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
			adminToken: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
			adminUser: Configuration.get('ROCKET_CHAT_ADMIN_USER') as string,
			adminPassword: Configuration.get('ROCKET_CHAT_ADMIN_PASSWORD') as string,
		}),
	],
	providers: [RocketChatUserRepo, RocketChatUserService],
	exports: [RocketChatUserService],
})
export class RocketChatUserModule {}
