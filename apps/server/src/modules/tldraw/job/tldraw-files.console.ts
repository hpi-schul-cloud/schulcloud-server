import { Command, Console } from 'nestjs-console';
import { LegacyLogger } from '@src/core/logger';
import { TldrawDeleteFilesUc } from '../uc';

@Console({ command: 'files', description: 'tldraw file deletion console' })
export class TldrawFilesConsole {
	constructor(private deleteFilesUc: TldrawDeleteFilesUc, private logger: LegacyLogger) {
		this.logger.setContext(TldrawFilesConsole.name);
	}

	@Command({
		command: 'deletion-job <hours>',
		description:
			'tldraw file deletion job to delete files no longer used in board - only files older than <hours> hours will be marked for deletion',
	})
	async deleteUnusedFiles(minimumFileAgeInHours: number): Promise<void> {
		this.logger.log(
			`Start tldraw file deletion job: marking files for deletion that are no longer used in whiteboard but only older than ${minimumFileAgeInHours} hours to prevent deletion of files that may still be used in an open whiteboard`
		);
		const thresholdDate = new Date();
		thresholdDate.setHours(thresholdDate.getHours() - minimumFileAgeInHours);

		await this.deleteFilesUc.deleteUnusedFiles(thresholdDate);
		this.logger.log('deletion job finished');
	}
}
