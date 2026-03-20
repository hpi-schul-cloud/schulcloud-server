import { Logger } from '@core/logger';
import { InternalServerErrorException } from '@nestjs/common';
import archiver from 'archiver';
import { PassThrough } from 'node:stream';
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
		const archive = archiver(archiveType);

		archive.on('warning', (err) => {
			if (err.code === 'ENOENT') {
				this.logWarning(files, logger);
			} else {
				throw new InternalServerErrorException('Error while creating archive on warning event', { cause: err });
			}
		});

		archive.on('error', (err) => {
			throw new InternalServerErrorException('Error while creating archive', { cause: err });
		});

		archive.on('close', () => {
			this.logClose(files, logger);
		});

		const handleStreamError = (err: unknown): void => {
			archive.emit('error', err as Error);
		};

		for (const file of fileResponse) {
			const passthrough = new PassThrough();
			file.data.on('error', handleStreamError);
			passthrough.on('error', handleStreamError);
			file.data.pipe(passthrough);
			archive.append(passthrough, { name: file.name });
		}

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		archive.finalize();

		return archive;
	}

	private static logWarning(fileRecords: FileDo[], logger: Logger): void {
		logger.warning(new CreateArchiveLoggable('Warning while creating archive', 'createArchive', fileRecords));
	}

	private static logClose(fileRecords: FileDo[], logger: Logger): void {
		logger.debug(new CreateArchiveLoggable('Archive created', 'createArchive', fileRecords));
	}
}
