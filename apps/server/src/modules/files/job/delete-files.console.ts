import { LegacyLogger } from '@src/core/logger/legacy-logger.service';
import { Command, Console } from 'nestjs-console';
import { DeleteFilesUc } from '../uc/delete-files.uc';

@Console({ command: 'files', description: 'file deletion console' })
export class DeleteFilesConsole {
	constructor(private deleteFilesUc: DeleteFilesUc, private logger: LegacyLogger) {
		this.logger.setContext(DeleteFilesConsole.name);
	}

	@Command({
		command: 'cleanup-job <days> [batchSize]',
		description: 'cleanup job to remove files that were marked for deletion <days> days ago',
	})
	async deleteMarkedFiles(daysSinceDeletion: number, batchSize = 1000): Promise<void> {
		this.logger.log(
			`Start cleanup job: Deleting files that were marked for deletion at least ${daysSinceDeletion} days ago; batch size: ${batchSize}`
		);
		const thresholdDate = new Date();
		thresholdDate.setDate(thresholdDate.getDate() - daysSinceDeletion);

		await this.deleteFilesUc.deleteMarkedFiles(thresholdDate, Number(batchSize));
		this.logger.log('cleanup job finished');
	}
}
