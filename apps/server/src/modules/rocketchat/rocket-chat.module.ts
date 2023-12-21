import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { RocketChatOptions, RocketChatService } from './rocket-chat.service';
import { DeleteRocketChatChannelHandler, TeamDeletedSaga } from '@modules/rocketchat/event';

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
				DeleteRocketChatChannelHandler,
				TeamDeletedSaga,
			],
			exports: [RocketChatService, DeleteRocketChatChannelHandler, TeamDeletedSaga],
		};
	}
}
