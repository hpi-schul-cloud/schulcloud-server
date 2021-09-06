import { Console, Command, createSpinner } from 'nestjs-console';
import { Logger } from '../../../core/logger/logger.service';
import { DeleteFilesUc } from '../uc';

@Console()
export class DeleteFilesController {
	private logger: Logger;

	constructor(private deleteFilesUc: DeleteFilesUc) {
		this.logger = new Logger(DeleteFilesController.name);
	}

	@Command({
		command: 'remove-deleted-files-data-removed-since-days <days>',
		description: 'cleanup job to remove file data of deleted files that have been removed since <days> days.',
	})
	async removeDeletedFilesData(removedSinceDays: number): Promise<void> {
		const removedSince = new Date();
		removedSince.setDate(removedSince.getDate() - removedSinceDays);

		await this.deleteFilesUc.removeDeletedFilesData(removedSince);
	}
}
