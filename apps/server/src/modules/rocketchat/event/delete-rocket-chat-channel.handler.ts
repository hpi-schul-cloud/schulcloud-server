import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { EntityId } from '@shared/domain/types';
import { RocketChatService } from '@modules/rocketchat';

export class DeleteRocketChatChannelCommand implements ICommand {
	constructor(readonly teamId: EntityId) {}
}

@CommandHandler(DeleteRocketChatChannelCommand)
export class DeleteRocketChatChannelHandler implements ICommandHandler<DeleteRocketChatChannelCommand> {
	constructor(private readonly rocketChatService: RocketChatService) {}

	async execute(command: DeleteRocketChatChannelCommand): Promise<void> {
		console.log('delete rocketchat channel ', command.teamId);
		// 1. bla = rocketChatChannelRepo.findByTeamId(command.teamId)
		// 2. this.rocketChatService.deleteGroup(bla.channelName)
		// 3. wrap stuff in a "service"
		return Promise.resolve();
	}
}
