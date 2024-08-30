import { S3ClientAdapter } from '@infra/s3-client';
import { Inject } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';
import { Readable } from 'stream';
import { Doc, encodeStateAsUpdateV2 } from 'yjs';
import { S3_CONNECTION_NAME } from '../config';
import { YMongodb } from '../repo';

export const encodeS3ObjectName = (docName: string) =>
	`${encodeURIComponent(docName)}/index/${encodeURIComponent(docName)}`;

@Console({ command: 'migration', description: 'tldraw migrate from mongodb to s3' })
export class TldrawMigrationConsole {
	constructor(
		private readonly tldrawBoardRepo: YMongodb,
		private logger: LegacyLogger,
		@Inject(S3_CONNECTION_NAME) private readonly storageClient: S3ClientAdapter
	) {
		this.logger.setContext(TldrawMigrationConsole.name);
	}

	@Command({
		command: 'run [chunks]',
		description: 'execute migrate',
	})
	async migrate(chunks = 100): Promise<string[]> {
		const affectedDocs: Array<string> = [];

		this.logger.log(`Start tldraw migration form mongodb to s3`);
		const docNames = await this.tldrawBoardRepo.getAllDocumentNames();

		const docNameChunks = this.chunk(docNames, chunks);
		for await (const docNameChunk of docNameChunks) {
			const promises = docNameChunk.map(async (docName) => {
				const result = await this.tldrawBoardRepo.getDocument(docName);
				if (!result) {
					this.logger.error(`Document not found: ${docName}`);
					return;
				}
				const { name, connections, awareness, awarenessChannel, isFinalizing, ...doc } = result;

				if (result.store.pendingStructs) {
					this.logger.log(`Remove pendingStructs from ${docName}`);
					result.store.pendingStructs = null;
					result.store.pendingDs = null;
				}

				const file = {
					data: Readable.from(Buffer.from(encodeStateAsUpdateV2(doc as Doc))),
					mimeType: 'binary/octet-stream',
				};

				const res = await this.storageClient.create(encodeS3ObjectName(docName), file);
				if ('Key' in res) {
					affectedDocs.push(res.Key as string);
				}
				this.logger.log(res);
			});

			await Promise.all(promises);
		}

		this.logger.log(`Found ${docNames.length} tldraw docs in mongodb`);
		this.logger.log(`migration job finished with ${affectedDocs.length} affected docs`);

		return affectedDocs;
	}

	private chunk(array: string[], size: number): string[][] {
		const r = Array(Math.ceil(array.length / size)).fill(null);
		return r.map((e, i) => array.slice(i * size, i * size + size));
	}
}
