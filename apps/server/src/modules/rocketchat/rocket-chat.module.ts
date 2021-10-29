import { Module, DynamicModule, HttpModule } from '@nestjs/common';
import { RocketChatOptions, RocketChatService } from './rocket-chat.service';

@Module({})
export class RocketChatModule {
	static forRoot(options: RocketChatOptions): DynamicModule {
		return {
			module: RocketChatModule,
			imports: [HttpModule],
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
