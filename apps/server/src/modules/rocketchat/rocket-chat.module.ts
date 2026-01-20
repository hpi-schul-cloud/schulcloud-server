import { ConfigurationModule } from '@infra/configuration';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ROCKET_CHAT_CONFIG_TOKEN, RocketChatConfig } from './rocket-chat.config';
import { RocketChatService } from './rocket-chat.service';
@Module({
	imports: [
		ConfigurationModule.register(ROCKET_CHAT_CONFIG_TOKEN, RocketChatConfig),
		HttpModule.registerAsync({
			imports: [ConfigurationModule.register(ROCKET_CHAT_CONFIG_TOKEN, RocketChatConfig)],
			useFactory: (config: RocketChatConfig) => {
				return {
					timeout: config.clientTimeoutInMs,
				};
			},
			inject: [ROCKET_CHAT_CONFIG_TOKEN],
		}),
	],
	providers: [RocketChatService],
	exports: [RocketChatService],
})
export class RocketChatModule {}
