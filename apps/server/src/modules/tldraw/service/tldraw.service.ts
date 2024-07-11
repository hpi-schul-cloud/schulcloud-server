import { Injectable } from '@nestjs/common';
import { TldrawBoardRepo, TldrawRepo } from '../repo';
import Y from 'yjs';

@Injectable()
export class TldrawService {
	constructor(private readonly tldrawRepo: TldrawRepo, private readonly tldrawBoardRepo: TldrawBoardRepo) {
	}

	async deleteByDocName(docName: string): Promise<void> {
		const drawings = await this.tldrawRepo.findByDocName(docName);
		await this.tldrawRepo.delete(drawings);
	}

	async documentStatistics(docName: string) {
		const doc = await this.tldrawBoardRepo.getDocumentFromDb(docName);

		if (doc?.store?.pendingStructs) {
			const missingSize = doc.store.pendingStructs.missing.size;
			const updateLength = doc.store.pendingStructs.update.length;
			const pendingUpdate = doc.store.pendingStructs.update;
			const decodedUpdate = Y.decodeUpdateV2(pendingUpdate);
			const clients: { id: number; count: number }[] = [];

			decodedUpdate.structs.forEach((struct) => {
				if (!clients.find((client) => client.id === struct.id.client)) {
					clients.push({ id: struct.id.client, count: 1 });
				} else {
					clients.find((client) => client.id === struct.id.client)!.count += 1;
				}
			});

			console.log(
				`Found pendingStructs in doc ${docName}; size of missing: ${missingSize}; size of update: ${updateLength}; number of pending structs: ${decodedUpdate.structs.length}; number of clients in pending structs: ${clients.length}; number of clients in doc ${doc.store.clients.size}`
			);
		}
	}
}
