import { LegacyLogger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';
import Y from 'yjs';
import { TldrawBoardRepo } from '../repo';
import { TldrawDeleteFilesUc } from '../uc';

@Console({ command: 'files', description: 'tldraw file deletion console' })
export class TldrawFilesConsole {
	constructor(
		private deleteFilesUc: TldrawDeleteFilesUc,
		private logger: LegacyLogger,
		private readonly tldrawBoardRepo: TldrawBoardRepo
	) {
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

	@Command({ command: 'get <docName>' })
	async get(docName: string): Promise<void> {
		const doc = await this.tldrawBoardRepo.getDocumentFromDb(docName);

		console.log(doc);
	}

	@Command({ command: 'compress <docName>' })
	async compress(docName: string): Promise<void> {
		await this.tldrawBoardRepo.compressDocument(docName);
	}

	@Command({ command: 'snapshot <docName>' })
	async snapshot(docName: string): Promise<void> {
		const doc = await this.tldrawBoardRepo.getDocumentFromDb(docName);

		const snapshot = Y.snapshot(doc);

		console.log(snapshot);
	}

	@Command({ command: 'findPending' })
	async findDocsWithPendingStructs() {
		const docNames = await this.tldrawBoardRepo.getAllDocumentNames();
		console.log(`Found ${docNames.length} documents in total. Checking for pendingStructs in each document.`);

		let numberOfDocsWithPendingStructs = 0;

		const promises = docNames.map(async (docName) => {
			console.log(docName);
			const doc = await this.tldrawBoardRepo.getDocumentFromDb(docName);

			if (doc?.store?.pendingStructs) {
				numberOfDocsWithPendingStructs += 1;
				const missingSize = doc.store.pendingStructs.missing.size;
				const updateLength = doc.store.pendingStructs.update.length;
				console.log(
					`pendingStructs in doc ${docName}; size of missing: ${missingSize}; size of update: ${updateLength}`
				);
			}
		});

		await Promise.all(promises);

		console.log(`Found ${numberOfDocsWithPendingStructs} documents with pendingStructs in ${docNames.length} docs.`);
	}
}
