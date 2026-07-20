import { Logger } from '@infra/logger';
import { NotificationEntry, NotificationService, NotificationType } from '@modules/notification';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Archiver } from 'archiver';

import { FileDo } from './do';
import { ArchiveFactory, FileResponseFactory } from './factory';
import { LegacyFileStorageAdapter } from './legacy-file-storage.adapter';
import { MissingFilesNotificationFailedLoggable } from './loggable/missing-files-notification-failed.loggable';
import { SkipFileLoggable } from './loggable/skip-file.loggable';
import { GetFileResponse } from './types';

interface MissingFile {
	id: EntityId;
	name: string;
}

@Injectable()
export class DownloadArchiveService {
	constructor(
		private readonly logger: Logger,
		private readonly legacyFileStorageAdapter: LegacyFileStorageAdapter,
		private readonly notificationService: NotificationService
	) {
		this.logger.setContext(DownloadArchiveService.name);
	}

	public async downloadFilesAsArchive(
		ownerId: EntityId,
		archiveName: string,
		userId: EntityId
	): Promise<GetFileResponse> {
		const files = await this.legacyFileStorageAdapter.getFilesForOwner(ownerId);
		const filesById = this.createFileMap(files);
		const downloadableFiles = this.filterDownloadableFiles(files);

		const archive = ArchiveFactory.createEmpty(downloadableFiles, this.logger);
		this.populateArchiveAndFinalize(archive, downloadableFiles, filesById, userId).catch((err: unknown) =>
			archive.emit('error', err as Error)
		);

		return FileResponseFactory.createFromArchive(archiveName, archive);
	}

	private createFileMap(files: FileDo[]): Map<EntityId, FileDo> {
		return new Map(files.map((file) => [file.id, file]));
	}

	private filterDownloadableFiles(files: FileDo[]): FileDo[] {
		return files.filter((file) => !file.isDirectory);
	}

	private async populateArchiveAndFinalize(
		archive: Archiver,
		files: FileDo[],
		filesById: Map<EntityId, FileDo>,
		userId: EntityId
	): Promise<void> {
		const missingFiles = await this.populateArchive(archive, files, filesById);

		if (missingFiles.length > 0) {
			await this.notifyMissingFiles(userId, missingFiles);
		}

		await archive.finalize();
	}

	private async populateArchive(
		archive: Archiver,
		files: FileDo[],
		filesById: Map<EntityId, FileDo>
	): Promise<Array<MissingFile>> {
		const missingFiles: Array<MissingFile> = [];

		for (const file of files) {
			const missing = await this.tryAppendFile(archive, file, filesById);
			if (missing !== null) missingFiles.push(missing);
		}

		return missingFiles;
	}

	private async tryAppendFile(
		archive: Archiver,
		file: FileDo,
		filesById: Map<EntityId, FileDo>
	): Promise<MissingFile | null> {
		try {
			const fileResponse = await this.downloadFileWithPath(file, filesById);
			await this.appendAndWaitForEntry(archive, fileResponse);

			return null;
		} catch {
			this.logger.warning(new SkipFileLoggable(file.id, file.name));

			return { id: file.id, name: file.name };
		}
	}

	private async notifyMissingFiles(userId: EntityId, missingFiles: Array<MissingFile>): Promise<void> {
		const entry: NotificationEntry = {
			type: NotificationType.ERROR,
			key: 'files.archive.missingFiles',
			arguments: { missingFiles },
			userId,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		};

		await this.notificationService.createNotification(entry).catch(() =>
			this.logger.warning(
				new MissingFilesNotificationFailedLoggable(
					userId,
					missingFiles.map((f) => f.id)
				)
			)
		);
	}

	private appendAndWaitForEntry(archive: Archiver, fileResponse: GetFileResponse): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const onEntry = (): void => {
				archive.off('error', onError);
				resolve();
			};
			const onError = (err: Error): void => {
				archive.off('entry', onEntry);
				reject(err);
			};
			archive.once('entry', onEntry);
			archive.once('error', onError);
			ArchiveFactory.appendFile(archive, fileResponse);
		});
	}

	private async downloadFileWithPath(file: FileDo, filesById: Map<EntityId, FileDo>): Promise<GetFileResponse> {
		const data = await this.legacyFileStorageAdapter.downloadFile(file.id, file.name);

		const fileResponse = {
			name: this.buildFilePath(file, filesById),
			data,
		};

		return fileResponse;
	}

	private buildFilePath(file: FileDo, filesById: Map<EntityId, FileDo>): string {
		const pathSegments: string[] = [];
		let currentFile: FileDo | undefined = file;

		while (currentFile) {
			pathSegments.unshift(currentFile.sanitizedName);
			currentFile = currentFile.parentId ? filesById.get(currentFile.parentId) : undefined;
		}

		return pathSegments.join('/');
	}
}
