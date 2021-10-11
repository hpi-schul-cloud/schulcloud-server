import { Console, Command } from 'nestjs-console';
import { Logger } from '../../../core/logger/logger.service';
import { DeleteFilesUc } from '../uc';

@Console({ command: 'files', description: 'file deletion console' })
export class DeleteFilesConsole {
	private logger: Logger;

	constructor(private deleteFilesUc: DeleteFilesUc) {
		this.logger = new Logger(DeleteFilesConsole.name);
	}

	@Command({
		command: 'remove-deleted-files <days>',
		options: [
			{
				flags: '-d, --days <days>',
				required: false,
				description: 'removed files that where marked for deletion <days> days ago',
			},
		],
		description: 'cleanup job to remove files that were marked for deletion <days> days ago',
	})
	async removeDeletedFilesData(removedSinceDays: number): Promise<void> {
		const removedSince = new Date();
		removedSince.setDate(removedSince.getDate() - removedSinceDays);

		await this.deleteFilesUc.removeDeletedFilesData(removedSince);
	}
}
