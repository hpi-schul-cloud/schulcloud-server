import { Logger } from '@core/logger';
import archiver from 'archiver';
import { PassThrough } from 'node:stream';
import { ArchiveFactory, FileDo } from '../domain';

const createFileResponse = (name: string, content: string): { name: string; data: PassThrough } => {
	const stream = new PassThrough();
	stream.end(content);

	return { name, data: stream };
};

export class ArchiveTestFactory {
	public static build(done: (err?: unknown) => void, chunks: Buffer[] = [], logger: Logger): archiver.Archiver {
		const fileResponses = [createFileResponse('file1.txt', 'hello'), createFileResponse('file2.txt', 'world')];
		const files: FileDo[] = [];
		const archive = ArchiveFactory.create(fileResponses, files, logger, 'zip');

		archive.on('data', (chunk) => chunks.push(chunk));
		archive.on('error', (err) => done(err));

		return archive;
	}
}
