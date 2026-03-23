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

	public static createEmpty(files: FileDo[], logger: Logger, archiveType: archiver.Format = 'zip'): archiver.Archiver {
		const archive = archiver(archiveType);

		archive.on('warning', (err) => {
			if (err.code === 'ENOENT') {
				this.logWarning(files, logger);
			} else {
				logger.warning(new CreateArchiveLoggable('Warning while creating archive', 'createArchive', files, err));
			}
		});

		archive.on('error', (err) => {
			logger.warning(new CreateArchiveLoggable('Error while creating archive', 'createArchive', files, err));
		});

		archive.on('close', () => {
			this.logClose(files, logger);
		});

		return archive;
	}

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
