import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { RocketChatOptions, RocketChatService } from './rocket-chat.service';

@Module({})
export class RocketChatModule {
	static forRoot(options: RocketChatOptions): DynamicModule {
		return {
			module: RocketChatModule,
			imports: [HttpModule, LoggerModule],
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
