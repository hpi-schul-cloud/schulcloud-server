import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { DeletionLogService, DeletionRequestService } from '../service';
import { DeletionLog } from '../do';
import { UserDeletedCommand } from './user-deleted.command';

@CommandHandler(UserDeletedCommand)
export class UserDeletedHandler implements ICommandHandler<UserDeletedCommand> {
	private config: string[] = [
		'account',
		'board',
		'class',
		'courseGroup',
		'course',
		'dashboard',
		'file',
		'fileRecords',
		'lessons',
		'news',
		'pseudonyms',
		'rocketChatUser',
		'submissions',
		'task',
		'teams',
		'user',
	];

	constructor(
		private readonly deletionLogService: DeletionLogService,
		private readonly deletionRequestService: DeletionRequestService // private readonly publisher: EventPublisher
	) {}

	async execute(command: UserDeletedCommand) {
		/*
		const hero = this.publisher.mergeObjectContext(await this.repository.findOneById(+heroId));
		hero.addItem(itemId);
		hero.commit();
 		*/
		const { deletionRequestId, domainDeletionReport } = command;
		await this.deletionLogService.createDeletionLog(deletionRequestId, domainDeletionReport);
		const deletionLogs: DeletionLog[] = await this.deletionLogService.findByDeletionRequestId(deletionRequestId);
		if (this.checkLogsPerDomain(deletionLogs)) {
			await this.deletionRequestService.markDeletionRequestAsExecuted(deletionRequestId);
		}
	}

	private checkLogsPerDomain(deletionLogs: DeletionLog[]): boolean {
		return this.config.every((domain) => deletionLogs.some((log) => log.domain === domain));
	}
}
