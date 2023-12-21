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
		// this.rocketChatService.deleteGroup()
		return Promise.resolve();
	}
}
