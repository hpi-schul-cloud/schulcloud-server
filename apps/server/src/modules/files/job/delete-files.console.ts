import { Logger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';
import { DeleteFilesUc } from '../uc';

@Console({ command: 'files', description: 'file deletion console' })
export class DeleteFilesConsole {
	constructor(private deleteFilesUc: DeleteFilesUc, private logger: Logger) {
		this.logger.setContext(DeleteFilesConsole.name);
	}

	@Command({
		command: 'cleanup-job <days> <batchSize>',
		description: 'cleanup job to remove files that were marked for deletion <days> days ago',
	})
	async removeDeletedFilesData(removedSinceDays: number, batchSize = 1000): Promise<void> {
		this.logger.log(`cleanup job will remove files that were marked for deletion ${removedSinceDays} days ago`);
		const removedSince = new Date();
		removedSince.setDate(removedSince.getDate() - removedSinceDays);

		await this.deleteFilesUc.deleteMarkedFiles(removedSince, Number(batchSize));
		this.logger.log('cleanup job finished');
	}
}
