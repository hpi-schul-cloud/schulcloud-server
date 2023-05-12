import { LegacyLogger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';
import { DeleteFilesUc } from '../uc';

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
			`Start cleanup job: Deleting files that were marked for deletion ${daysSinceDeletion} days ago; batch size: ${batchSize}`
		);
		const deletedSince = new Date();
		deletedSince.setDate(deletedSince.getDate() - daysSinceDeletion);

		await this.deleteFilesUc.deleteMarkedFiles(deletedSince, Number(batchSize));
		this.logger.log('cleanup job finished');
	}
}
