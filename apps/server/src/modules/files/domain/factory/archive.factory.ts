import { Logger } from '@core/logger';
import archiver from 'archiver';
import { FileDo } from '../do';
import { CreateArchiveLoggable } from '../loggable';
import { GetFileResponse } from '../types';

export class ArchiveFactory {
	public static create(
		fileResponse: GetFileResponse[],
		files: FileDo[],
		logger: Logger,
		archiveType: archiver.Format = 'zip'
	): archiver.Archiver {
		const archive = this.createEmpty(files, logger, archiveType);

		for (const file of fileResponse) {
			this.appendFile(archive, file);
		}

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		archive.finalize();

		return archive;
	}

	/**
	 * Creates an archiver with event handlers attached but without any files appended and without finalizing.
	 * Use {@link appendFile} to add files and call `archive.finalize()` when done.
	 */
	public static createEmpty(files: FileDo[], logger: Logger, archiveType: archiver.Format = 'zip'): archiver.Archiver {
		const archive = archiver(archiveType);

		archive.on('warning', (err) => {
			if (err.code === 'ENOENT') {
				this.logWarning(files, logger);
			} else {
				logger.warning(new CreateArchiveLoggable('Warning while creating archive', 'createArchive', files, err));
			}
		});

		// Do not throw inside this handler — the error propagates naturally through the stream
		// pipeline to whoever is consuming the archive (e.g. an HTTP response pipe). Throwing
		// here would escape the event-loop tick with no try/catch and crash the process.
		archive.on('error', (err) => {
			logger.warning(new CreateArchiveLoggable('Error while creating archive', 'createArchive', files, err));
		});

		archive.on('close', () => {
			this.logClose(files, logger);
		});

		return archive;
	}

	/** Appends a single file stream to an existing archive. No PassThrough layer — the source
	 * stream is handed directly to archiver to avoid an extra in-memory buffer. */
	public static appendFile(archive: archiver.Archiver, fileResponse: GetFileResponse): void {
		fileResponse.data.on('error', (err: unknown) => {
			archive.emit('error', err as Error);
		});
		archive.append(fileResponse.data, { name: fileResponse.name });
	}

	private static logWarning(fileRecords: FileDo[], logger: Logger): void {
		logger.warning(new CreateArchiveLoggable('Warning while creating archive', 'createArchive', fileRecords));
	}

	private static logClose(fileRecords: FileDo[], logger: Logger): void {
		logger.debug(new CreateArchiveLoggable('Archive created', 'createArchive', fileRecords));
	}
}
