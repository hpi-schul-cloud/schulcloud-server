import { Logger } from '@core/logger';
import { InternalServerErrorException } from '@nestjs/common';
import archiver from 'archiver';
import { PassThrough } from 'node:stream';
import { FileEntity } from '../../entity';
import { GetFileResponse } from '../interface';

export class ArchiveFactory {
	public static create(
		files: GetFileResponse[],
		fileRecords: FileEntity[],
		logger?: Logger,
		archiveType: archiver.Format = 'zip'
	): archiver.Archiver {
		const archive = archiver(archiveType);

		archive.on('warning', (err) => {
			if (err.code === 'ENOENT') {
				this.logWarning(fileRecords, logger);
			} else {
				throw new InternalServerErrorException('Error while creating archive on warning event', { cause: err });
			}
		});

		archive.on('error', (err) => {
			throw new InternalServerErrorException('Error while creating archive', { cause: err });
		});

		archive.on('close', () => {
			this.logClose(fileRecords, logger);
		});

		for (const file of files) {
			const passthrough = new PassThrough();
			file.data.pipe(passthrough);
			archive.append(passthrough, { name: file.name });
		}

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		archive.finalize();

		return archive;
	}

	private static logWarning(fileRecords: FileEntity[], logger?: Logger): void {
		/* logger?.warning(
			new FileStorageActionsLoggable('Warning while creating archive', {
				action: 'createArchive',
				sourcePayload: fileRecords,
			})
		); */
	}

	private static logClose(fileRecords: FileEntity[], logger?: Logger): void {
		/* logger?.debug(
			new FileStorageActionsLoggable('Archive created', {
				action: 'createArchive',
				sourcePayload: fileRecords,
			})
		); */
	}
}
