import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { RocketChatOptions, RocketChatService } from './rocket-chat.service';

@Module({})
export class RocketChatModule {
	static forRoot(options: RocketChatOptions): DynamicModule {
		return {
			module: RocketChatModule,
			imports: [
				HttpModule.register({
					timeout: options.rocketchatClientTimeoutInMs,
				}),
			],
			providers: [
				RocketChatService,
				{
					provide: 'ROCKET_CHAT_OPTIONS',
					useValue: options,
				},
			],
			exports: [RocketChatService],
		};
	}
}
