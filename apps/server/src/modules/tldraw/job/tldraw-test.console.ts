import { Command, Console } from 'nestjs-console';
import Y from 'yjs';
import { TldrawBoardRepo } from '../repo';

@Console({ command: 'test', description: 'tldraw test console' })
export class TldrawTestConsole {
	constructor(private readonly tldrawBoardRepo: TldrawBoardRepo) {}

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
