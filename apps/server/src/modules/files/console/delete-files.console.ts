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
				required: true,
				description: 'removed files that were marked for deletion <days> days ago',
			},
		],
		description: 'cleanup job to remove files that were marked for deletion <days> days ago',
	})
	async removeDeletedFilesData(removedSinceDays: number): Promise<void> {
		this.logger.log(`cleanup job will remove files that were marked for deletion ${removedSinceDays} days ago`);
		const removedSince = new Date();
		removedSince.setDate(removedSince.getDate() - removedSinceDays);

		await this.deleteFilesUc.removeDeletedFilesData(removedSince);
	}
}
