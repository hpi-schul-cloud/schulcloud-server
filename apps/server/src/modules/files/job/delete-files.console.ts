import { LegacyLogger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';
import { DeleteFilesUc } from '../uc';

@Console({ command: 'files', description: 'file deletion console' })
export class DeleteFilesConsole {
	constructor(private deleteFilesUc: DeleteFilesUc, private logger: LegacyLogger) {
		this.logger.setContext(DeleteFilesConsole.name);
	}

	@Command({
		command: 'cleanup-job <days>',
		description: 'cleanup job to remove files that were marked for deletion <days> days ago',
	})
	async removeDeletedFilesData(removedSinceDays: number): Promise<void> {
		this.logger.log(`cleanup job will remove files that were marked for deletion ${removedSinceDays} days ago`);
		const removedSince = new Date();
		removedSince.setDate(removedSince.getDate() - removedSinceDays);

		await this.deleteFilesUc.removeDeletedFilesData(removedSince);
		this.logger.log('cleanup job finished');
	}
}
